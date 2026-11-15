import styles from "./christmas-tree.module.css";

const lights = [[252, 122, 5], [211, 210, 6], [244, 264, 6], [164, 310, 5], [308, 323, 5]] as const;

/** Decorative vector artwork stays local and scales cleanly on phones. */
export function ChristmasTree() {
  return (
    <svg viewBox="0 0 440 400" fill="none" aria-hidden="true" focusable="false" className={styles.tree}>
      <defs>
        <radialGradient id="tree-glow"><stop offset="0" stopColor="#fbe6ac" stopOpacity=".9" /><stop offset="1" stopColor="#fbe6ac" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="237" cy="190" r="153" fill="#efe5cc" />
      <circle cx="237" cy="190" r="140" stroke="#d5bd88" strokeDasharray="2 9" className={styles.halo} />
      <ellipse cx="235" cy="352" rx="171" ry="13" fill="#dfd6bd" fillOpacity=".6" />
      <g stroke="#b79552" strokeWidth="1.5" strokeLinecap="round">
        <path d="M69 105v18m-9-9h18m-15-6 12 12m0-12-12 12" className={styles.sparkle} />
        <path d="M365 166v20m-10-10h20" className={styles.sparkle} />
        <path d="m112 45 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" className={styles.sparkle} />
        <path d="M379 271l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" className={styles.sparkle} />
      </g>
      <g fill="#b79552"><circle cx="349" cy="76" r="3" className={styles.glint} /><circle cx="86" cy="242" r="2" className={styles.glint} /><circle cx="321" cy="34" r="2" className={styles.glint} /></g>
      <path d="M225 296h24v53h-24z" fill="#8a5940" />
      <path d="M237 68c-22 46-51 76-82 102 17 10 36 12 49 11-24 37-52 62-77 81 17 10 34 13 51 12-18 25-35 45-56 62 61 15 167 15 229 0-23-18-41-40-58-63 17 1 34-2 51-11-31-23-58-50-78-81 18 1 35-3 49-11-35-28-61-59-78-102Z" fill="#245844" />
      <path d="M237 68c-8 39-20 73-42 104 13 6 26 8 42 8V68ZM237 180c-10 35-26 66-48 92 15 5 31 7 48 7v-99ZM237 278c-12 23-25 46-42 65 13 2 27 3 42 3v-68Z" fill="#326b51" />
      <g stroke="#d7b66e" strokeWidth="2.5" strokeLinecap="round">
        <path d="M201 130c17 15 36 22 65 24M174 206c26 21 64 35 111 36M165 294c32 14 84 25 143 22" pathLength={1} className={styles.garland} />
      </g>
      <g fill="url(#tree-glow)">
        <circle cx="237" cy="64" r="34" className={styles.topperHalo} />
      </g>
      <g fill="url(#tree-glow)">
        {lights.map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="15" className={styles.lightHalo} />)}
      </g>
      <path d="m237 39 7 15 17 2-12 12 3 17-15-8-15 8 3-17-12-12 17-2Z" fill="#d4a64e" stroke="#b78c3d" strokeLinejoin="round" className={styles.topper} />
      <g fill="#ac3842" stroke="#852c35" strokeWidth="1.5">
        <circle cx="222" cy="150" r="10" /><circle cx="273" cy="209" r="12" /><circle cx="184" cy="252" r="11" /><circle cx="266" cy="302" r="12" />
      </g>
      <g fill="#f2d58e">{lights.map(([cx, cy, r], index) => <circle key={index} cx={cx} cy={cy} r={r} className={styles.light} />)}</g>
      <g fill="#f7eac9"><circle cx="219" cy="147" r="2.5" className={styles.shine} /><circle cx="269" cy="205" r="3" className={styles.shine} /><circle cx="181" cy="249" r="3" className={styles.shine} /><circle cx="262" cy="298" r="3" className={styles.shine} /></g>
      <g className={styles.gift}>
        <g transform="rotate(-8 119 314)">
          <rect x="66" y="283" width="100" height="65" rx="3" fill="#a53640" />
          <path d="M106 283h17v65h-17z" fill="#e1bd77" />
          <rect x="61" y="276" width="110" height="15" rx="3" fill="#b8454e" />
          <path d="M106 276h17v15h-17z" fill="#edce8c" />
          <path d="M115 276c-37 1-33-29-15-21 8 4 15 21 15 21Zm0 0c37 1 33-29 15-21-8 4-15 21-15 21Z" stroke="#d6b16e" strokeWidth="5" />
        </g>
      </g>
      <g className={`${styles.gift} ${styles.giftLate}`}>
        <g transform="rotate(6 329 326)">
          <rect x="286" y="305" width="85" height="46" rx="3" fill="#f7edda" stroke="#cfbc96" />
          <path d="M321 305h13v46h-13z" fill="#a53640" />
          <rect x="282" y="298" width="93" height="13" rx="2" fill="#fcf5e6" stroke="#cfbc96" />
          <path d="M321 298h13v13h-13z" fill="#b8454e" />
          <path d="M328 298c-28 0-28-23-14-18 7 3 14 18 14 18Zm0 0c28 0 28-23 14-18-7 3-14 18-14 18Z" stroke="#a53640" strokeWidth="4" />
        </g>
      </g>
    </svg>
  );
}
