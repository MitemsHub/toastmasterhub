export type InvitationStatus = "pending" | "accepted" | "declined";

export type VpeRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  full_name: string;
  email: string;
  access_code_hash: string;
  access_code_last_sent_at?: string;
};

export type EvaluatorRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  vpe: string;
  full_name: string;
  email: string;
  profile: string;
  photo: string;
};

export type InvitationRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  vpe: string;
  evaluator: string;
  meeting_title: string;
  meeting_date: string;
  meeting_note?: string;
  status: InvitationStatus;
  token_hash: string;
  sent_at?: string;
  responded_at?: string;
  decline_note?: string;
};
