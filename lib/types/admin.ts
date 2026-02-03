export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type AdminStats = {
  // Global Admin Fields
  totalUsers?: number;
  activeTournaments?: number;
  totalMatches?: number;

  // Specific User Fields
  userTournaments?: number;
  liveMatches?: number;
  completedMatches?: number;
};

export type DashboardStats = {
  totalUsers?: number;
  activeTournaments?: number;
  totalMatches?: number;
  userTournaments?: number;
  liveMatches?: number;
  completedMatches?: number;
};
