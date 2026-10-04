package com.homepets.backend.dto;

public class RoomChoreSnapshotDTO {
    private final String choreId;
    private final String title;
    private final int rewardPoints;
    private final boolean enabled;
    private final boolean completedToday;
    private final boolean canComplete;

    public RoomChoreSnapshotDTO(String choreId, String title, int rewardPoints,
                                boolean enabled, boolean completedToday, boolean canComplete) {
        this.choreId = choreId;
        this.title = title;
        this.rewardPoints = rewardPoints;
        this.enabled = enabled;
        this.completedToday = completedToday;
        this.canComplete = canComplete;
    }

    public String getChoreId() { return choreId; }
    public String getTitle() { return title; }
    public int getRewardPoints() { return rewardPoints; }
    public boolean isEnabled() { return enabled; }
    public boolean isCompletedToday() { return completedToday; }
    public boolean isCanComplete() { return canComplete; }
}