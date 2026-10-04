package com.homepets.backend.model;

public enum ChoreEnum {
    TRASH("trash", 0, "Take out the trash", 30),
    DISHES("dishes", 1, "Wash dishes", 30),
    VACUUM("vacuum", 2, "Vacuum", 30);

    private final String id;
    private final int index;
    private final String name;
    private final int points;

    ChoreEnum(String id, int index, String name, int points) {
        this.id = id;
        this.index = index;
        this.name = name;
        this.points = points;
    }

    public String getId() { return id; }
    public int getIndex() { return index; }
    public String getName() { return name; }
    public int getPoints() { return points; }

    public static ChoreEnum getById(String id) {
        for (ChoreEnum chore : ChoreEnum.values()) {
            if (chore.getId().equalsIgnoreCase(id)) {
                return chore;
            }
        }
        return null;
    }
}