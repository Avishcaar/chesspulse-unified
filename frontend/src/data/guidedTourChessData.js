/**
 * ChessPulse Guided Camera Tour Data (Dynamic Piece Tracking & Practice Drill Edition)
 *
 * Every step has:
 * - Its own dedicated FEN position
 * - A choreographed timeline of automated moves that demonstrate the piece movement
 * - Spoken voice narration explaining the concept
 * - An interactive "test" drill allowing the user to practice the move themselves!
 */

export const GUIDED_TOUR_STEPS = [
  // ── 00. OVERVIEW ESTABLISHING SHOT ─────────────────────────────────────────
  {
    id: "tour-overview",
    stepIndex: 0,
    badge: "00 · THE BATTLEFIELD",
    shortLabel: "OVERVIEW",
    title: "The Royal Battlefield",
    pieceType: null,
    focusSquare: null,
    camera: {
      focusSquare: null,
      zoom: 0.88,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    actions: [],
    duration: 6500,
    spotlightSquares: [],
    targetSquares: [],
    arrows: [],
    narration:
      "Welcome to ChessPulse Academy. Let us explore the board together to master each piece's movement, captures, special rules, and essential opening principles.",
    caption: "A guided tour of the board to master piece movements, captures, and opening principles.",
    test: null,
  },

  {
    id: "tour-board-coordinates",
    stepIndex: 1,
    badge: "01 · THE BOARD",
    shortLabel: "BOARD MAP",
    title: "The Board: Setup, Files & Ranks",
    pieceType: null,
    focusSquare: null,
    camera: { focusSquare: null, zoom: 0.88, panOffsetX: 0, panOffsetY: 0 },
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    actions: [],
    duration: 6000,
    spotlightSquares: ["a1", "h8", "e4", "d5"],
    targetSquares: ["a1", "h8"],
    arrows: [["a1", "a8", "emerald"], ["a1", "h1", "gold"]],
    narration:
      "A chessboard has eight files, labeled A through H, and eight ranks, numbered 1 through 8. Together they name every square, like E4. Set the board with a light square at each player's right-hand corner. White starts at the bottom and makes the first move.",
    caption: "Files run A to H, ranks run 1 to 8. White moves first, and each side takes one turn at a time.",
    test: {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      prompt: "Your turn! Use the board coordinates to move the pawn from E2 to E4.",
      hint: "Find file E and rank 2, then move that pawn to E4.",
      validMoves: [{ from: "e2", to: "e4" }],
      resultFen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      successNarration: "You read the coordinates correctly. The pawn moved from E2 to E4.",
      correctionNarration: "E2 is on file E and rank 2. Move that pawn two squares forward to E4.",
    },
  },

  // ── 02. THE PAWN: 1-STEP & 2-STEP LEAP ─────────────────────────────────────
  {
    id: "tour-pawn-advance",
    stepIndex: 2,
    badge: "02 · THE PAWN",
    shortLabel: "PAWN",
    title: "Pawn: Single Step & Initial Leap",
    pieceType: "pawn",
    focusSquare: "e2",
    camera: {
      focusSquare: "e2",
      zoom: 2.1,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
    actions: [
      {
        time: 800,
        fen: "4k3/8/8/8/8/4P3/8/4K3 b - - 0 1", // moves to e3
        sound: "move",
        focusSquare: "e3",
        targetSquares: ["e2"],
        arrows: [["e2", "e3", "emerald"]],
      },
      {
        time: 2000,
        fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", // moves back to e2
        sound: "move",
        focusSquare: "e2",
        targetSquares: ["e4"],
        arrows: [["e2", "e4", "emerald"]],
      },
      {
        time: 3200,
        fen: "4k3/8/8/8/4P3/8/8/4K3 b - - 0 1", // leaps to e4!
        sound: "move",
        focusSquare: "e4",
        targetSquares: [],
        arrows: [["e2", "e4", "emerald"]],
      },
    ],
    duration: 6500,
    spotlightSquares: ["e2"],
    targetSquares: ["e3", "e4"],
    arrows: [["e2", "e3", "emerald"], ["e2", "e4", "emerald"]],
    narration:
      "The pawn can march forward one square to E3, it can step back, or leap two squares forward to E4 on its very first move.",
    caption: "Marches 1 square to E3, or leaps 2 squares to E4 on move one. Pawns never move backward.",
    test: {
      fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
      prompt: "Your turn! Move the pawn forward to E3 or leap to E4.",
      hint: "Pawns move straight forward! Drag the E2 pawn to E3 or E4.",
      validMoves: [
        { from: "e2", to: "e4" },
        { from: "e2", to: "e3" },
      ],
      successNarration: "Brilliant! You've mastered the pawn's forward march.",
      correctionNarration: "Not quite. Remember, the pawn advances straight forward to E3 or E4. Try again!",
    },
  },

  // ── 03. THE PAWN: DIAGONAL CAPTURE ─────────────────────────────────────────
  {
    id: "tour-pawn-capture",
    stepIndex: 3,
    badge: "03 · THE PAWN",
    shortLabel: "CAPTURE",
    title: "Pawn: Diagonal Capture Rule",
    pieceType: "pawn",
    focusSquare: "e4",
    camera: {
      focusSquare: "e4",
      zoom: 2.1,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "4k3/8/8/3p1p2/4P3/8/8/4K3 w - - 0 1",
    actions: [
      {
        time: 1000,
        fen: "4k3/8/8/3P1p2/8/8/8/4K3 b - - 0 1", // e4 captures d5
        sound: "capture",
        focusSquare: "d5",
        targetSquares: [],
        arrows: [["e4", "d5", "rose"]],
      },
    ],
    duration: 6000,
    spotlightSquares: ["e4"],
    targetSquares: ["d5", "f5"],
    arrows: [
      ["e4", "d5", "rose"],
      ["e4", "f5", "rose"],
    ],
    narration:
      "Pawns capture diagonally one square forward. Watch the pawn on E4 strike diagonally to capture the black pawn on D5.",
    caption: "Captures diagonally forward. Blocked pawns cannot move forward until obstructions clear.",
    test: {
      fen: "4k3/8/8/3p1p2/4P3/8/8/4K3 w - - 0 1",
      prompt: "Your turn! Capture one of the black pawns diagonally.",
      hint: "Pawns capture diagonally forward! Strike at D5 or F5.",
      validMoves: [
        { from: "e4", to: "d5" },
        { from: "e4", to: "f5" },
      ],
      successNarration: "Excellent capture! Pawns strike diagonally forward.",
      correctionNarration: "Pawns capture one square diagonally forward. Try capturing the pawn on D5 or F5!",
    },
  },

  {
    id: "tour-sliding-captures",
    stepIndex: 4,
    badge: "04 · CAPTURES",
    shortLabel: "BLOCKED PATHS",
    title: "Captures, Blockers & Clear Paths",
    pieceType: "rook",
    focusSquare: "a1",
    camera: { focusSquare: "a1", zoom: 2.1, panOffsetX: 0, panOffsetY: 0 },
    initialFen: "7k/p7/8/8/8/8/P7/R6K w - - 0 1",
    actions: [
      {
        time: 900,
        fen: "7k/p7/8/8/8/P7/8/R6K b - - 0 1",
        sound: "move",
        focusSquare: "a3",
        targetSquares: ["a7"],
        arrows: [["a2", "a3", "emerald"]],
      },
      {
        time: 2300,
        fen: "7k/R7/8/8/8/P7/8/7K b - - 1 1",
        sound: "capture",
        focusSquare: "a7",
        targetSquares: [],
        arrows: [["a1", "a7", "rose"]],
      },
    ],
    duration: 6000,
    spotlightSquares: ["a1", "a2", "a7"],
    targetSquares: ["a2", "a7"],
    arrows: [["a1", "a7", "emerald"]],
    narration:
      "Most pieces capture by moving onto an opponent's square. Sliding pieces like the rook cannot jump over anything, so the path must be clear. Watch the pawn step out of the way, then the rook captures the pawn on A7. The knight is the only piece that can jump over other pieces.",
    caption: "Move onto an opponent's square to capture. Sliding pieces need a clear path; only the knight can jump.",
    test: {
      fen: "7k/p7/8/8/8/P7/8/R6K w - - 0 1",
      prompt: "Your turn! Capture the pawn on A7 with the rook.",
      hint: "The A-file is clear now. Slide the rook from A1 to A7.",
      validMoves: [{ from: "a1", to: "a7" }],
      resultFen: "7k/R7/8/8/8/P7/8/7K b - - 0 1",
      successNarration: "Good capture. The rook reached the pawn because every square along the file was clear.",
      correctionNarration: "A rook travels in a straight line and cannot jump. Follow the A-file up to A7.",
    },
  },

  // ── 05. THE PAWN: EN PASSANT ───────────────────────────────────────────────
  {
    id: "tour-pawn-en-passant",
    stepIndex: 5,
    badge: "05 · THE PAWN",
    shortLabel: "EN PASSANT",
    title: "Pawn: En Passant (In Passing)",
    pieceType: "pawn",
    focusSquare: "e5",
    camera: {
      focusSquare: "e5",
      zoom: 2.1,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "4k3/5p2/8/4P3/8/8/8/4K3 b - - 0 1",
    actions: [
      {
        time: 900,
        fen: "4k3/8/8/4Pp2/8/8/8/4K3 w - f6 0 2", // Black leaps f7 to f5
        sound: "move",
        focusSquare: "e5",
        targetSquares: ["f6"],
        arrows: [["f7", "f5", "emerald"], ["e5", "f6", "emerald"]],
      },
      {
        time: 2600,
        fen: "4k3/8/5P2/8/8/8/8/4K3 b - - 0 2", // White captures e5 to f6 en passant!
        sound: "capture",
        focusSquare: "f6",
        targetSquares: [],
        arrows: [["e5", "f6", "emerald"]],
      },
    ],
    duration: 6500,
    spotlightSquares: ["e5"],
    targetSquares: ["f5", "f6"],
    arrows: [["e5", "f6", "emerald"]],
    narration:
      "When Black leaps two squares forward landing directly beside your pawn on rank five, you can capture it en passant, stepping diagonally behind it.",
    caption: "En Passant: If an enemy pawn leaps 2 squares beside yours, capture it diagonally behind it.",
    test: {
      fen: "4k3/8/8/4Pp2/8/8/8/4K3 w - f6 0 2",
      prompt: "Your turn! Execute the en passant capture.",
      hint: "Step diagonally behind the black pawn by moving your pawn to F6.",
      validMoves: [
        { from: "e5", to: "f6" },
      ],
      resultFen: "4k3/8/5P2/8/8/8/8/4K3 b - - 0 2",
      successNarration: "Magnificent! You executed en passant with precision.",
      correctionNarration: "To capture en passant, move your pawn diagonally behind Black to F6. Give it another try!",
    },
  },

  // ── 06. THE PAWN: CORONATION PROMOTION ─────────────────────────────────────
  {
    id: "tour-pawn-promotion",
    stepIndex: 6,
    badge: "06 · THE PAWN",
    shortLabel: "PROMOTION",
    title: "Pawn: Coronation Promotion",
    pieceType: "pawn",
    focusSquare: "e7",
    camera: {
      focusSquare: "e7",
      zoom: 2.1,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "7k/4P3/8/8/8/8/8/4K3 w - - 0 1",
    actions: [
      {
        time: 1000,
        fen: "4Q2k/8/8/8/8/8/8/4K3 b - - 0 1", // crowns into Queen!
        sound: "castle",
        focusSquare: "e8",
        targetSquares: [],
        arrows: [["e7", "e8", "gold"]],
      },
    ],
    duration: 6000,
    spotlightSquares: ["e7"],
    targetSquares: ["e8"],
    arrows: [["e7", "e8", "gold"]],
    narration:
      "When a pawn marches all the way to the eighth rank, it undergoes coronation and transforms immediately into a Queen!",
    caption: "Reaching the 8th rank promotes the pawn into a Queen, Rook, Bishop, or Knight.",
    test: {
      fen: "7k/4P3/8/8/8/8/8/4K3 w - - 0 1",
      prompt: "Your turn! March the pawn to the 8th rank to promote into a Queen.",
      hint: "Advance the pawn from E7 to E8.",
      validMoves: [
        { from: "e7", to: "e8" },
      ],
      resultFen: "4Q2k/8/8/8/8/8/8/4K3 b - - 0 1",
      successNarration: "All hail the Queen! Your pawn has achieved glorious coronation.",
      correctionNarration: "Push your pawn straight to the back rank on E8 to promote. Try again!",
    },
  },

  // ── 07. THE KNIGHT: L-SHAPE & BARRIER LEAP ─────────────────────────────────
  {
    id: "tour-knight",
    stepIndex: 7,
    badge: "07 · THE KNIGHT",
    shortLabel: "KNIGHT",
    title: "The Knight: The L-Shape & Barrier Leap",
    pieceType: "knight",
    focusSquare: "d4",
    camera: {
      focusSquare: "d4",
      zoom: 2.1,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "4k3/8/8/2ppp3/2pNp3/2ppp3/8/4K3 w - - 0 1",
    actions: [
      {
        time: 1000,
        fen: "4k3/8/8/2pppN2/2p1p3/2ppp3/8/4K3 b - - 1 1", // leaps over wall to f5
        sound: "move",
        focusSquare: "f5",
        targetSquares: ["e7"],
        arrows: [["d4", "f5", "emerald"]],
      },
      {
        time: 2600,
        fen: "4k3/4N3/8/2ppp3/2p1p3/2ppp3/8/4K3 b - - 2 2", // leaps to e7 checking king!
        sound: "check",
        focusSquare: "e7",
        targetSquares: [],
        arrows: [["f5", "e7", "rose"]],
      },
    ],
    duration: 6500,
    spotlightSquares: ["d4"],
    targetSquares: ["f5", "e6", "c6", "b5"],
    arrows: [["d4", "f5", "emerald"]],
    narration:
      "The knight moves in an L-shape and is the only piece on the board that can leap straight over walls of pawns.",
    caption: "Moves 2 squares cardinal, 1 perpendicular. The only piece that leaps over other pieces.",
    test: {
      fen: "4k3/8/8/2ppp3/2pNp3/2ppp3/8/4K3 w - - 0 1",
      prompt: "Your turn! Leap over the pawns with the Knight.",
      hint: "The Knight hops in an L-shape! Try leaping over to F5, E6, C6, or B5.",
      validMoves: [
        { from: "d4", to: "f5" },
        { from: "d4", to: "e6" },
        { from: "d4", to: "c6" },
        { from: "d4", to: "b5" },
      ],
      successNarration: "Outstanding! The Knight leaps straight over barriers in its signature L-shape.",
      correctionNarration: "Remember: the Knight moves 2 squares in one direction and 1 square perpendicular. Try leaping to F5!",
    },
  },

  // ── 08. THE BISHOP: DIAGONAL SNIPER ────────────────────────────────────────
  {
    id: "tour-bishop",
    stepIndex: 8,
    badge: "08 · THE BISHOP",
    shortLabel: "BISHOP",
    title: "The Bishop: Diagonal Flight",
    pieceType: "bishop",
    focusSquare: "c1",
    camera: {
      focusSquare: "c1",
      zoom: 2.1,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "4k3/8/8/8/8/8/8/2B1K3 w - - 0 1",
    actions: [
      {
        time: 1000,
        fen: "4k3/8/8/6B1/8/8/8/4K3 b - - 1 1", // slides to g5
        sound: "move",
        focusSquare: "g5",
        targetSquares: ["e7"],
        arrows: [["c1", "g5", "emerald"]],
      },
      {
        time: 2500,
        fen: "4k3/4B3/8/8/8/8/8/4K3 b - - 2 2", // slides to e7
        sound: "move",
        focusSquare: "e7",
        targetSquares: [],
        arrows: [["g5", "e7", "emerald"]],
      },
    ],
    duration: 6500,
    spotlightSquares: ["c1"],
    targetSquares: ["a3", "d2", "e3", "f4", "g5", "h6"],
    arrows: [["c1", "g5", "emerald"]],
    narration:
      "The bishop glides diagonally across unobstructed squares, locked forever to its starting square color, striking from long range.",
    caption: "Glides unlimited diagonal squares, locked forever to light or dark squares.",
    test: {
      fen: "4k3/8/8/8/8/8/8/2B1K3 w - - 0 1",
      prompt: "Your turn! Glide the Bishop diagonally along the light-square highway.",
      hint: "Slide your Bishop from C1 to G5 or any open diagonal square.",
      validMoves: [
        { from: "c1", to: "g5" },
        { from: "c1", to: "f4" },
        { from: "c1", to: "e3" },
        { from: "c1", to: "d2" },
        { from: "c1", to: "h6" },
        { from: "c1", to: "b2" },
        { from: "c1", to: "a3" },
      ],
      successNarration: "Splendid! The Bishop glides diagonally with unlimited range.",
      correctionNarration: "Bishops move diagonally along squares of their own color. Slide the Bishop to G5!",
    },
  },

  // ── 09. THE ROOK: OPEN FILE & 7TH RANK ─────────────────────────────────────
  {
    id: "tour-rook",
    stepIndex: 9,
    badge: "09 · THE ROOK",
    shortLabel: "ROOK",
    title: "The Rook: Open File & 7th Rank",
    pieceType: "rook",
    focusSquare: "d1",
    camera: {
      focusSquare: "d1",
      zoom: 2.1,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "4k3/2p1p3/8/8/8/8/8/3RK3 w - - 0 1",
    actions: [
      {
        time: 1000,
        fen: "4k3/2pRp3/8/8/8/8/8/4K3 b - - 1 1", // slides down d-file to d7!
        sound: "move",
        focusSquare: "d7",
        targetSquares: ["c7"],
        arrows: [["d1", "d7", "emerald"]],
      },
      {
        time: 2600,
        fen: "5k2/2R1p3/8/8/8/8/8/4K3 b - - 0 2", // captures c7 on the 7th rank!
        sound: "capture",
        focusSquare: "c7",
        targetSquares: [],
        arrows: [["d7", "c7", "rose"]],
      },
    ],
    duration: 6500,
    spotlightSquares: ["d1"],
    targetSquares: ["d7", "d8", "a1", "h1"],
    arrows: [["d1", "d7", "emerald"]],
    narration:
      "The rook commands horizontal ranks and vertical files with unlimited range. Infiltrating the seventh rank paralyzes the opponent's camp.",
    caption: "Dominates straight ranks and files. Maximum power on open files and the 7th rank.",
    test: {
      fen: "4k3/2p1p3/8/8/8/8/8/3RK3 w - - 0 1",
      prompt: "Your turn! Slide your Rook down the open D-file to invade the 7th rank.",
      hint: "Slide the Rook on D1 straight down the D-file to D7.",
      validMoves: [
        { from: "d1", to: "d7" },
        { from: "d1", to: "d8" },
        { from: "d1", to: "d6" },
      ],
      successNarration: "Lethal invasion! Controlling the 7th rank paralyzes the opposing army.",
      correctionNarration: "Rooks move straight along vertical files and horizontal ranks. Push your Rook to D7!",
    },
  },

  // ── 10. THE QUEEN: OMNIDIRECTIONAL POWER ───────────────────────────────────
  {
    id: "tour-queen",
    stepIndex: 10,
    badge: "10 · THE QUEEN",
    shortLabel: "QUEEN",
    title: "The Queen: Omnidirectional Mastery",
    pieceType: "queen",
    focusSquare: "d4",
    camera: {
      focusSquare: "d4",
      zoom: 2.1,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1",
    actions: [
      {
        time: 1000,
        fen: "4k3/8/8/8/7Q/8/8/4K3 b - - 1 1", // horizontal slide d4 to h4
        sound: "move",
        focusSquare: "h4",
        targetSquares: ["e7"],
        arrows: [["d4", "h4", "emerald"]],
      },
      {
        time: 2500,
        fen: "4k3/4Q3/8/8/8/8/8/4K3 b - - 2 2", // diagonal slide h4 to e7
        sound: "check",
        focusSquare: "e7",
        targetSquares: [],
        arrows: [["h4", "e7", "rose"]],
      },
    ],
    duration: 6500,
    spotlightSquares: ["d4"],
    targetSquares: ["h4", "d8", "a4", "h8", "a1"],
    arrows: [
      ["d4", "h4", "emerald"],
      ["d4", "d8", "gold"],
      ["d4", "a4", "gold"],
    ],
    narration:
      "The queen is your most lethal piece, combining the powers of the rook and bishop across ranks, files, and diagonals in all eight directions.",
    caption: "Combines the powers of the Rook and Bishop across ranks, files, and diagonals.",
    test: {
      fen: "4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1",
      prompt: "Your turn! Move the Queen to demonstrate her omnidirectional reach.",
      hint: "Move the Queen to H4, E5, D8, or any legal square.",
      validMoves: [
        { from: "d4", to: "h4" },
        { from: "d4", to: "e5" },
        { from: "d4", to: "d8" },
        { from: "d4", to: "a4" },
        { from: "d4", to: "g4" },
        { from: "d4", to: "f4" },
      ],
      successNarration: "Dominant! The Queen commands ranks, files, and diagonals in all directions.",
      correctionNarration: "The Queen can slide any number of squares in any direction. Try moving to H4 or E5!",
    },
  },

  // ── 11. THE KING & CASTLING ────────────────────────────────────────────────
  {
    id: "tour-king",
    stepIndex: 11,
    badge: "11 · THE KING",
    shortLabel: "KING",
    title: "The King & Kingside Castling",
    pieceType: "king",
    focusSquare: "e1",
    camera: {
      focusSquare: "e1",
      zoom: 2.1,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "4k3/8/8/8/8/8/PPPP1PPP/R3K2R w KQ - 0 1",
    actions: [
      {
        time: 1100,
        fen: "4k3/8/8/8/8/8/PPPP1PPP/R4RK1 b - - 1 1", // King & Rook Castle!
        sound: "castle",
        focusSquare: "g1",
        targetSquares: [],
        arrows: [
          ["e1", "g1", "gold"],
          ["h1", "f1", "emerald"],
        ],
      },
    ],
    duration: 6500,
    spotlightSquares: ["e1"],
    targetSquares: ["g1", "f1", "d1"],
    arrows: [
      ["e1", "g1", "gold"],
      ["h1", "f1", "emerald"],
    ],
    narration:
      "The king moves one square in any direction. Watch castling: the king steps two squares toward the corner, and the rook leaps over to protect him.",
    caption: "Steps 1 square in any direction. Castling tucks the King into safety and activates the Rook.",
    test: {
      fen: "4k3/8/8/8/8/8/PPPP1PPP/R3K2R w KQ - 0 1",
      prompt: "Your turn! Castle your King to the kingside for instant safety.",
      hint: "Drag your King two squares from E1 to G1 to castle.",
      validMoves: [
        { from: "e1", to: "g1" },
      ],
      resultFen: "4k3/8/8/8/8/8/PPPP1PPP/R4RK1 b - - 1 1",
      successNarration: "Perfect castling! The King is secured behind a fortress and the Rook is mobilized.",
      correctionNarration: "To castle kingside, move your King two squares toward the corner to G1. Try again!",
    },
  },

  {
    id: "tour-queenside-castling",
    stepIndex: 12,
    badge: "12 · CASTLING",
    shortLabel: "QUEENSIDE",
    title: "Queenside Castling & Its Rules",
    pieceType: "king",
    focusSquare: "e1",
    camera: { focusSquare: "e1", zoom: 2.1, panOffsetX: 0, panOffsetY: 0 },
    initialFen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
    actions: [
      {
        time: 1000,
        fen: "r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1",
        sound: "castle",
        focusSquare: "c1",
        targetSquares: [],
        arrows: [["e1", "c1", "gold"], ["a1", "d1", "emerald"]],
      },
    ],
    duration: 6000,
    spotlightSquares: ["e1", "c1", "d1", "a1"],
    targetSquares: ["c1", "d1"],
    arrows: [["e1", "c1", "gold"], ["a1", "d1", "emerald"]],
    narration:
      "Castling can happen on either side. In queenside castling, the king moves from E1 to C1 and the A1 rook moves to D1. The squares between them must be empty, neither piece may have moved before, and the king cannot castle out of check, through check, or into check.",
    caption: "Queenside castling moves the king two squares and brings the rook beside it, subject to king-safety rules.",
    test: {
      fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
      prompt: "Your turn! Castle queenside to bring the king to safety.",
      hint: "Move the king from E1 to C1. The rook will move to D1 as part of the same move.",
      validMoves: [{ from: "e1", to: "c1" }],
      resultFen: "r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1",
      successNarration: "Queenside castling complete. The king and rook moved together in one special move.",
      correctionNarration: "For queenside castling, move the king two squares toward the A-file rook, from E1 to C1.",
    },
  },

  {
    id: "tour-check",
    stepIndex: 13,
    badge: "13 · CHECK",
    shortLabel: "CHECK",
    title: "Check: Your King Is Under Attack",
    pieceType: "king",
    focusSquare: "e1",
    camera: { focusSquare: "e1", zoom: 2.1, panOffsetX: 0, panOffsetY: 0 },
    initialFen: "7k/8/8/8/r7/8/8/4K3 b - - 0 1",
    actions: [
      {
        time: 1000,
        fen: "7k/8/8/8/4r3/8/8/4K3 w - - 1 1",
        sound: "check",
        focusSquare: "e1",
        targetSquares: ["d1", "f1", "d2", "f2"],
        arrows: [["e4", "e1", "rose"]],
      },
    ],
    duration: 6000,
    spotlightSquares: ["e1", "e4"],
    targetSquares: ["d1", "f1", "d2", "f2"],
    arrows: [["e4", "e1", "rose"]],
    narration:
      "Check means the king is under attack. You must answer check immediately: move the king to safety, capture the attacking piece, or block its path when possible. Here the rook checks along the E-file, so the king must move off that file.",
    caption: "When your king is in check, your next move must remove the attack. You may never leave your king in check.",
    test: {
      fen: "7k/8/8/8/4r3/8/8/4K3 w - - 1 1",
      prompt: "Your turn! Move the king out of the rook's check.",
      hint: "Choose a safe square away from the E-file, such as D1, F1, D2, or F2.",
      validMoves: [
        { from: "e1", to: "d1" },
        { from: "e1", to: "f1" },
        { from: "e1", to: "d2" },
        { from: "e1", to: "f2" },
      ],
      successNarration: "Safe! Your king has left the rook's line of attack.",
      correctionNarration: "The king must move to a square the rook does not attack. Step off the E-file.",
    },
  },

  {
    id: "tour-mate-and-stalemate",
    stepIndex: 14,
    badge: "14 · GAME ENDINGS",
    shortLabel: "MATE OR DRAW",
    title: "Checkmate & Stalemate",
    pieceType: null,
    focusSquare: null,
    camera: { focusSquare: null, zoom: 0.88, panOffsetX: 0, panOffsetY: 0 },
    initialFen: "6k1/5ppp/8/8/8/8/8/K3R3 w - - 0 1",
    actions: [
      {
        time: 1100,
        fen: "4R1k1/5ppp/8/8/8/8/8/K7 b - - 1 1",
        sound: "check",
        focusSquare: "g8",
        targetSquares: ["f8", "h8"],
        arrows: [["e1", "e8", "gold"]],
      },
      {
        time: 3200,
        fen: "7k/5K2/8/6Q1/8/8/8/8 w - - 0 1",
        sound: "move",
        focusSquare: "h8",
        targetSquares: ["g8", "g7", "h7"],
        arrows: [],
      },
      {
        time: 4300,
        fen: "7k/5K2/6Q1/8/8/8/8/8 b - - 1 1",
        sound: "move",
        focusSquare: "h8",
        targetSquares: [],
        arrows: [["g5", "g6", "emerald"]],
      },
    ],
    duration: 6500,
    spotlightSquares: ["e8", "g8", "h8"],
    targetSquares: ["f8", "h8"],
    arrows: [["e1", "e8", "gold"]],
    narration:
      "Checkmate ends the game: the king is attacked and has no legal escape. Stalemate is different: the player to move is not in check but has no legal move, so the game is a draw. Watch the rook deliver mate, then the queen leave the opposing king with no move but no check.",
    caption: "Checkmate wins. Stalemate draws. The key difference is whether the king is in check.",
    test: null,
  },

  {
    id: "tour-piece-values",
    stepIndex: 15,
    badge: "15 · PIECE VALUES",
    shortLabel: "MATERIAL",
    title: "Piece Values & Safe Captures",
    pieceType: "bishop",
    focusSquare: "g2",
    camera: { focusSquare: "g2", zoom: 2.1, panOffsetX: 0, panOffsetY: 0 },
    initialFen: "7k/8/8/3q4/8/8/6B1/4K3 w - - 0 1",
    actions: [
      {
        time: 1000,
        fen: "7k/8/8/3B4/8/8/8/4K3 b - - 0 1",
        sound: "capture",
        focusSquare: "d5",
        targetSquares: [],
        arrows: [["g2", "d5", "gold"]],
      },
    ],
    duration: 6000,
    spotlightSquares: ["g2", "d5"],
    targetSquares: ["d5"],
    arrows: [["g2", "d5", "gold"]],
    narration:
      "Players use simple point values to compare material: a pawn is about one point, a knight or bishop about three, a rook about five, and a queen about nine. The king is priceless. These values are guides, not rules; whether a trade is good also depends on king safety and the position. Here, a bishop can capture an undefended queen.",
    caption: "Approximate values help compare trades: pawn 1, knight and bishop 3, rook 5, queen 9. Keep your king safe.",
    test: {
      fen: "7k/8/8/3q4/8/8/6B1/4K3 w - - 0 1",
      prompt: "Your turn! Capture the undefended queen with your bishop.",
      hint: "Follow the diagonal from G2 through F3 and E4 to D5.",
      validMoves: [{ from: "g2", to: "d5" }],
      resultFen: "7k/8/8/3B4/8/8/8/4K3 b - - 0 1",
      successNarration: "Excellent. You spotted a valuable piece that could be captured safely.",
      correctionNarration: "The bishop moves along clear diagonals. Capture the queen on D5 from G2.",
    },
  },

  // ── 16. GOLDEN OPENING LAWS ────────────────────────────────────────────────
  {
    id: "tour-principles",
    stepIndex: 16,
    badge: "16 · OPENING LAWS",
    shortLabel: "LAWS",
    title: "The 3 Golden Opening Laws",
    pieceType: null,
    focusSquare: null,
    camera: {
      focusSquare: null,
      zoom: 0.88,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5",
    actions: [
      {
        time: 1200,
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b kq - 7 5", // White Castles!
        sound: "castle",
        focusSquare: null,
        targetSquares: ["g1"],
        arrows: [["e1", "g1", "gold"]],
      },
    ],
    duration: 6500,
    spotlightSquares: ["e4", "d4", "e5", "d5"],
    targetSquares: ["c3", "f3", "c4"],
    arrows: [
      ["e2", "e4", "gold"],
      ["d2", "d4", "gold"],
    ],
    narration:
      "Follow the three golden laws: control the center squares, develop your minor pieces quickly, and castle early for king safety.",
    caption: "1. Control central e4 and d4. 2. Develop knights and bishops. 3. Castle early.",
    test: {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      prompt: "Your turn! Stake your claim in the center with 1. e4 or 1. d4.",
      hint: "Control central territory by pushing your E-pawn to E4 or your D-pawn to D4.",
      validMoves: [
        { from: "e2", to: "e4" },
        { from: "d2", to: "d4" },
        { from: "g1", to: "f3" },
        { from: "b1", to: "c3" },
      ],
      successNarration: "Grandmaster principle! Claiming the center sets up a commanding position.",
      correctionNarration: "Remember the first golden law: claim the center squares. Move your pawn to E4 or D4!",
    },
  },

  // ── 17. CLASSIC OPENING: THE ITALIAN GAME ──────────────────────────────────
  {
    id: "tour-italian",
    stepIndex: 17,
    badge: "17 · ITALIAN GAME",
    shortLabel: "ITALIAN",
    title: "The Italian Game (1. e4 e5 2. Nf3 Nc6 3. Bc4)",
    pieceType: null,
    focusSquare: "e2",
    camera: {
      focusSquare: "e2",
      zoom: 1.45,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    actions: [
      {
        time: 700,
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", // 1. e4
        sound: "move",
        focusSquare: "e4",
        targetSquares: ["e4"],
        arrows: [["e2", "e4", "gold"]],
      },
      {
        time: 1600,
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", // 1... e5
        sound: "move",
        focusSquare: "e5",
        targetSquares: ["e5"],
        arrows: [["e7", "e5", "rose"]],
      },
      {
        time: 2500,
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", // 2. Nf3
        sound: "move",
        focusSquare: "f3",
        targetSquares: ["f3"],
        arrows: [["g1", "f3", "gold"]],
      },
      {
        time: 3400,
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", // 2... Nc6
        sound: "move",
        focusSquare: "c6",
        targetSquares: ["c6"],
        arrows: [["b8", "c6", "emerald"]],
      },
      {
        time: 4300,
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", // 3. Bc4!
        sound: "move",
        focusSquare: "c4",
        targetSquares: ["c4"],
        arrows: [["f1", "c4", "gold"], ["c4", "f7", "rose"]],
      },
    ],
    duration: 7500,
    spotlightSquares: ["c4", "f7"],
    targetSquares: ["e4"],
    arrows: [
      ["e2", "e4", "gold"],
    ],
    narration:
      "In the Italian game, both players claim the center, mobilize their knights, and White slices the bishop toward F7, Black's most vulnerable square.",
    caption: "1. e4 e5 2. Nf3 Nc6 3. Bc4 targeting Black's vulnerable f7 square.",
    test: {
      fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
      prompt: "Your turn! Play 3. Bc4 to target Black's weak f7 square.",
      hint: "Develop your bishop from F1 to C4 targeting F7.",
      validMoves: [
        { from: "f1", to: "c4" },
      ],
      resultFen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
      successNarration: "Exceptional! 3. Bc4 defines the Italian Game and puts immediate pressure on Black.",
      correctionNarration: "In the Italian Game, White develops the Bishop to C4 targeting F7. Give it a try!",
    },
  },

  // ── 18. CLASSIC OPENING: THE SICILIAN DEFENSE ──────────────────────────────
  {
    id: "tour-sicilian",
    stepIndex: 18,
    badge: "18 · SICILIAN DEFENSE",
    shortLabel: "SICILIAN",
    title: "The Sicilian Defense (1. e4 c5)",
    pieceType: null,
    focusSquare: "e2",
    camera: {
      focusSquare: "e2",
      zoom: 1.45,
      panOffsetX: 0,
      panOffsetY: 0,
    },
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    actions: [
      {
        time: 700,
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", // 1. e4
        sound: "move",
        focusSquare: "e4",
        targetSquares: ["e4"],
        arrows: [["e2", "e4", "gold"]],
      },
      {
        time: 1600,
        fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", // 1... c5!
        sound: "move",
        focusSquare: "c5",
        targetSquares: ["c5"],
        arrows: [["c7", "c5", "rose"]],
      },
      {
        time: 2500,
        fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", // 2. Nf3
        sound: "move",
        focusSquare: "f3",
        targetSquares: ["f3"],
        arrows: [["g1", "f3", "gold"]],
      },
      {
        time: 3400,
        fen: "rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3", // 2... d6
        sound: "move",
        focusSquare: "d6",
        targetSquares: ["d6"],
        arrows: [["d7", "d6", "rose"]],
      },
      {
        time: 4300,
        fen: "rnbqkbnr/pp2pppp/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3", // 3. d4
        sound: "move",
        focusSquare: "d4",
        targetSquares: ["d4"],
        arrows: [["d2", "d4", "gold"]],
      },
      {
        time: 5200,
        fen: "rnbqkbnr/pp2pppp/3p4/8/3nP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 4", // 3... cxd4 4. Nxd4
        sound: "capture",
        focusSquare: "d4",
        targetSquares: ["d4"],
        arrows: [["c5", "d4", "rose"]],
      },
    ],
    duration: 7500,
    spotlightSquares: ["c5", "d4"],
    targetSquares: ["e4"],
    arrows: [
      ["e2", "e4", "gold"],
    ],
    narration:
      "The Sicilian defense challenges the center asymmetrically, trading a flank C-pawn for White's central D-pawn to spark counter-attacks.",
    caption: "1. e4 c5 fights for central d4 with a flank pawn for sharp counterplay.",
    test: {
      fen: "rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
      prompt: "Your turn! Blow open the center with 3. d4.",
      hint: "Challenge Black's flank pawn on C5 by advancing your D-pawn from D2 to D4.",
      validMoves: [
        { from: "d2", to: "d4" },
      ],
      resultFen: "rnbqkbnr/pp2pppp/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3",
      successNarration: "Explosive! 3. D4 opens lines for White's pieces and claims central superiority.",
      correctionNarration: "Play 3. D4 to challenge Black's C5 pawn and crack open the central files. Try again!",
    },
  },
];
