import type { ICourse, ITimetableDatabase, ITimetableEntry } from "../types/database";
import type { ICellContent } from "../types/grid";
import { generateTimeLabels, getCellKey } from "./temputils";
import { defaultBlockedTexts, dayLabels } from "./constants";

export const isCellBlocked = (
    cellContent: ICellContent | undefined,
    blockedTexts: string[],
): boolean => {
    if (!cellContent?.text) return false;
    const text = cellContent.text.toLowerCase().trim();
    return blockedTexts.some((blocked) => text.includes(blocked.toLowerCase()));
};

export const extractTimetableData = (
    cellContents: Map<string, ICellContent>,
    hiddenCells: Set<string>,
    columnCount: number,
    columnDurations: { [key: number]: number },
    defaultSlotDuration: number,
    mergedCells?: Map<string, { rowSpan: number; colSpan: number }>,
): ITimetableEntry[] => {
    const timeLabels = generateTimeLabels(columnCount, columnDurations, defaultSlotDuration);
    const entries: ITimetableEntry[] = [];

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < columnCount; col++) {
            const cellKey = `${row}-${col}`;
            if (hiddenCells.has(cellKey)) continue;
            void mergedCells?.get(cellKey);

            const cellContent = cellContents.get(cellKey);
            const entry: ITimetableEntry = {
                cellKey,
                row,
                col,
                day: dayLabels[row],
                timeSlot: timeLabels[col],
                customText: cellContent?.text,
                isVertical: cellContent?.isVertical,
                alignment: cellContent?.alignment,
            };
            entries.push(entry);
        }
    }

    return entries;
};

export const generateAutomatedTimetable = (
    database: ITimetableDatabase,
    columnCount: number,
    existingCellContents: Map<string, ICellContent>,
    hiddenCells: Set<string>,
    selectedClassId?: string,
): Map<string, ICellContent> => {
    const newCellContents = new Map(existingCellContents);
    const {
        tutors,
        courses,
        sessions,
        blockedTexts = defaultBlockedTexts,
    } = database;

    let classSubjects = courses;
    let className = "";

    if (selectedClassId) {
        const selectedClass = sessions.find((c) => c.id === selectedClassId);
        if (selectedClass) {
            className = selectedClass.name;
            classSubjects = courses.filter((subject) =>
                selectedClass.subjects.includes(subject.id),
            );
        }
    }

    const schedule: (ICourse | null | "BLOCKED")[][] = Array(5)
        .fill(null)
        .map(() => Array(columnCount).fill(null));

    // Mark blocked slots
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < columnCount; col++) {
            const cellKey = getCellKey(row, col);
            if (hiddenCells.has(cellKey)) continue;
            const cellContent = existingCellContents.get(cellKey);
            if (isCellBlocked(cellContent, blockedTexts)) {
                schedule[row][col] = "BLOCKED";
            }
        }
    }

    // Sort subjects by priority and periods per week
    const sortedSubjects = [...classSubjects].sort((a, b) => {
        const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const aPriority = (priorityWeight[a.priority] ?? 1) * a.periodsPerWeek;
        const bPriority = (priorityWeight[b.priority] ?? 1) * b.periodsPerWeek;
        return bPriority - aPriority;
    });

    // Track teacher assignments per day
    const teacherDailyCount: { [teacherId: string]: number[] } = {};
    tutors.forEach((teacher) => {
        teacherDailyCount[teacher.id] = Array(5).fill(0);
    });

    // Assign subjects to schedule
    for (const subject of sortedSubjects) {
        const teacher = tutors.find((t) => t.id === subject.teacherId);
        if (!teacher) continue;

        let periodsAssigned = 0;
        let attempts = 0;
        const maxAttempts = subject.periodsPerWeek * 10;

        while (periodsAssigned < subject.periodsPerWeek && attempts < maxAttempts) {
            attempts++;

            const availableSlots: { row: number; col: number }[] = [];
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < columnCount; col++) {
                    if (schedule[row][col] === null) {
                        const maxPerDay = teacher.maxPeriodsPerDay || 3;
                        if (teacherDailyCount[teacher.id][row] >= maxPerDay) continue;
                        const cellKey = getCellKey(row, col);
                        if (teacher.unavailableSlots?.includes(cellKey)) continue;
                        if (subject.avoidConsecutive && col > 0 && schedule[row][col - 1] === subject) continue;
                        if (subject.avoidConsecutive && col < columnCount - 1 && schedule[row][col + 1] === subject) continue;
                        availableSlots.push({ row, col });
                    }
                }
            }

            if (availableSlots.length === 0) break;

            let chosenSlots = availableSlots;
            if (subject.preferredSlots && subject.preferredSlots.length > 0) {
                const preferred = availableSlots.filter((slot) =>
                    subject.preferredSlots!.includes(getCellKey(slot.row, slot.col)),
                );
                if (preferred.length > 0) chosenSlots = preferred;
            }

            const randomIndex = Math.floor(Math.random() * chosenSlots.length);
            const selectedSlot = chosenSlots[randomIndex];
            schedule[selectedSlot.row][selectedSlot.col] = subject;
            teacherDailyCount[teacher.id][selectedSlot.row]++;
            periodsAssigned++;
        }
    }

    // Fill remaining empty slots with subjects in round-robin
    if (sortedSubjects.length > 0) {
        let subjectIndex = 0;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < columnCount; col++) {
                if (schedule[row][col] === null) {
                    let foundSubject = false;
                    let attemptsToFind = 0;
                    while (!foundSubject && attemptsToFind < sortedSubjects.length) {
                        const subject = sortedSubjects[subjectIndex];
                        const teacher = tutors.find((t) => t.id === subject.teacherId);
                        if (teacher) {
                            const cellKey = getCellKey(row, col);
                            const maxPerDay = teacher.maxPeriodsPerDay || 3;
                            if (
                                teacherDailyCount[teacher.id][row] < maxPerDay &&
                                !teacher.unavailableSlots?.includes(cellKey)
                            ) {
                                schedule[row][col] = subject;
                                teacherDailyCount[teacher.id][row]++;
                                foundSubject = true;
                            }
                        }
                        subjectIndex = (subjectIndex + 1) % sortedSubjects.length;
                        attemptsToFind++;
                    }
                }
            }
        }
    }

    // Convert schedule back to cell contents
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < columnCount; col++) {
            const cellKey = getCellKey(row, col);
            const subject = schedule[row][col];
            if (subject && typeof subject !== "string") {
                const teacher = tutors.find((t) => t.id === subject.teacherId);
                let text = teacher ? `${subject.name}\n(${teacher.name})` : subject.name;
                if (className) text = `${text}\n(${className})`;

                newCellContents.set(cellKey, {
                    text,
                    isVertical: false,
                    alignment: "center",
                    className: selectedClassId,
                });
            }
        }
    }

    return newCellContents;
};
