export interface SecondaryItem {
  id: string;
  dueDateLabel?: string;        // e.g. "Dec 8" — omit or "" means no date
  status: "done" | "not_done";  // done = ✓, not_done = ✕
}

export interface Task {
  id: string;
  text: string;
  secondary: SecondaryItem[];   // empty [] = no margin entries at all
}

export interface Day {
  id: string;
  dateLabel: string;
  tasks: Task[];
}

/* ─── Demo data matching the handwritten notebook ─── */
export const DEMO_DAYS: Day[] = [
  {
    id: "day-1",
    dateLabel: "Dec 5",
    tasks: [
      {
        id: "t1",
        text: "Dropped AG-561 worms to large plates — Stored in 1% oxygen until 24 → Mutagenize",
        secondary: [
          { id: "s1a", dueDateLabel: "Dec 8", status: "done" },
          { id: "s1b", dueDateLabel: "Dec 6", status: "done" },
        ],
      },
      {
        id: "t2",
        text: "Dropped BOCA3 × BOCA1 F1 N to large plates incubated at 21% oxygen",
        secondary: [
          { id: "s2a", dueDateLabel: "Dec 8", status: "done" },
        ],
      },
      {
        id: "t3",
        text: "Measured BOCA3 N F2 growth assay from 100% oxygen (Day 2). To do Day 3.",
        secondary: [
          { id: "s3a", dueDateLabel: "Dec 6", status: "done" },
        ],
      },
      {
        id: "t4",
        text: "Picked Fxn — overexpress carrying array to new plates. To measure",
        secondary: [
          { id: "s4a", dueDateLabel: "Dec 6", status: "done" },
        ],
      },
      {
        id: "t5",
        text: "H.mS × Hsp6:GFP → 3× ♂, 2× ♀. Need males to grow so can pick more.",
        secondary: [
          { id: "s5a", dueDateLabel: "Dec 6", status: "done" },
        ],
      },
    ],
  },
  {
    id: "day-2",
    dateLabel: "Dec 10",
    tasks: [
      {
        id: "t6",
        text: "Dropped F2 BOCA3 × BOCA1 N to 50% O₂ → To egg prep on days 3, 4, 5",
        secondary: [
          { id: "s6a", dueDateLabel: "Dec 13", status: "done" },
        ],
      },
      {
        id: "t7",
        text: "Washed & stored WB samples → N2 at 1, 21, 50, 100% O₂ → BOCA3 at 100% O₂ → BOCA3×1 at 1, 21, 50% 100% Next",
        secondary: [
          { id: "s7a", dueDateLabel: "Dec 11", status: "done" },
        ],
      },
      {
        id: "t8",
        text: "Moved BOCA3 Suppressors to freeze box (Josh)",
        secondary: [
          { id: "s8a", status: "done" },
        ],
      },
      {
        id: "t9",
        text: "Suppressors for BOCA3 F2N retest: A3 (ist), C1, C2, C3, C5, E3, E5, E6, F1 (ist), F2, F5, G1, G2 (ist), G5, G6, H1, H2, H3",
        secondary: [
          { id: "s9a", status: "done" },
        ],
      },
      {
        id: "t10",
        text: "Suppressors for AG 377 F2N retest: A2, A3, B3, B6, G6, H6, I1, F2, L2, L3",
        secondary: [],
      },
      {
        id: "t11",
        text: "Cross plate of Hsp6:GFP + H.mS × BOCA3 / BOCA1 / BOCA3 / BOCA1",
        secondary: [
          { id: "s11a", dueDateLabel: "Dec 11", status: "done" },
        ],
      },
      {
        id: "t12",
        text: "Chunked BOCA3 Suppressors to large plates for DNA Prep",
        secondary: [
          { id: "s12a", dueDateLabel: "Dec 11", status: "done" },
        ],
      },
    ],
  },
];
