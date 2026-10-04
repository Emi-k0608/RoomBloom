package com.homepets.backend.dto;

import java.util.List;

public class RoomSnapshotDTO {
    private String roomId;
    private String roomName;
    private int version;
    private int points;
    private List<String> completedChoreIds;
    private List<String> unlockedItemIds;
    private String petName;
    private String petType;
    private List<RoomChoreSnapshotDTO> chores;

    public RoomSnapshotDTO(String roomId, String roomName, int version, int points,
                           List<String> completedChoreIds, List<String> unlockedItemIds,
                           String petName, String petType, List<RoomChoreSnapshotDTO> chores) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.version = version;
        this.points = points;
        this.completedChoreIds = completedChoreIds;
        this.unlockedItemIds = unlockedItemIds;
        this.petName = petName;
        this.petType = petType;
        this.chores = chores;
    }

    public String getRoomId() { return roomId; }
    public String getRoomName() { return roomName; }
    public int getVersion() { return version; }
    public int getPoints() { return points; }
    public List<String> getCompletedChoreIds() { return completedChoreIds; }
    public List<String> getUnlockedItemIds() { return unlockedItemIds; }
    public String getPetName() { return petName; }
    public String getPetType() { return petType; }
    public List<RoomChoreSnapshotDTO> getChores() { return chores; }
}