export type AvatarStyle = "sofia" | "miguel" | "ines" | "joao" | "ana" | "tomas" | "placeholder";

export interface Wish {
  id: string;
  title: string;
  note?: string;
  url?: string;
}

export interface Member {
  /** Permanent identity, independent of the person's editable display name. */
  id: string;
  name: string;
  avatar: AvatarStyle;
  avatarId?: string;
  colour: "peach" | "sage" | "lavender" | "sand" | "rose" | "blue";
  introduction?: string;
  interests: string[];
  wishes: Wish[];
  likes: string[];
  avoid: string[];
  sizes?: { label: string; value: string }[];
  note?: string;
}

export interface Family {
  name: string;
  year: number;
  welcome: string;
  exchangeDate?: string;
  budget?: { amount: number; currency: string };
}
