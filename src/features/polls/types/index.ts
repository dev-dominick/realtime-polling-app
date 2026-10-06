/**
 * Poll domain types
 */

export interface PollOption {
  id: string;
  label: string;
  position: number;
  votes: number;
  percentage: number;
}

export interface PollData {
  id: string;
  question: string;
  totalVotes: number;
  options: PollOption[];
}

export interface PollFormOption {
  id: string;
  value: string;
}
