package com.homepets.backend.service;

import com.homepets.backend.dto.RoomChoreSnapshotDTO;
import com.homepets.backend.dto.RoomSnapshotDTO;
import com.homepets.backend.model.ChoreEnum;
import com.homepets.backend.model.HomePet;
import com.homepets.backend.model.HomePetRoom;
import com.homepets.backend.model.RoomChore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RoomService {

    private static final Logger log = LoggerFactory.getLogger(RoomService.class);

    private static final ZoneId ROOM_ZONE = ZoneId.of("Asia/Taipei");
    private static final int RUG_COST = 50;

    private final HomePetRoom demoRoom;
    private final Set<String> unlockedItemIds = new HashSet<>();
    private int version = 2;

    public RoomService() {
        this.demoRoom = createDemoRoom();
    }

    public synchronized RoomSnapshotDTO getSnapshot() {
        LocalDate today = today();
        List<String> completedChoreIds = demoRoom.getChores().stream()
                .filter(chore -> chore.isCompletedOn(today))
                .map(RoomChore::getChoreId)
                .toList();
        List<RoomChoreSnapshotDTO> chores = demoRoom.getChores().stream()
                .map(chore -> {
                    boolean completedToday = chore.isCompletedOn(today);
                    return new RoomChoreSnapshotDTO(
                            chore.getChoreId(),
                            chore.getTitle(),
                            chore.getRewardPoints(),
                            chore.isEnabled(),
                            completedToday,
                            chore.isEnabled() && !completedToday
                    );
                })
                .toList();

        return new RoomSnapshotDTO(
                demoRoom.getRoomId(),
                demoRoom.getRoomName(),
                version,
                demoRoom.getAvailablePoints(),
                completedChoreIds,
                new ArrayList<>(unlockedItemIds),
                demoRoom.getPet().getName(),
                demoRoom.getPet().getType(),
                chores
        );
    }

    public synchronized ChoreCompletionResult completeChore(String choreId) {
        RoomChore chore = demoRoom.getChores().stream()
                .filter(candidate -> candidate.getChoreId().equalsIgnoreCase(choreId))
                .findFirst()
                .orElse(null);

        if (chore == null) {
            log.info("Cannot complete unknown chore [{}]", choreId);
            return ChoreCompletionResult.UNKNOWN_CHORE;
        }
        if (!chore.isEnabled()) {
            log.info("Cannot complete disabled chore [{}]", choreId);
            return ChoreCompletionResult.DISABLED;
        }

        LocalDate today = today();
        if (chore.isCompletedOn(today)) {
            log.info("Chore [{}] was already completed today", choreId);
            return ChoreCompletionResult.ALREADY_COMPLETED;
        }

        chore.completeOn(today);
        demoRoom.addPoints(chore.getRewardPoints());
        version++;
        log.info("Completed chore [{}], awarded {} points (total={}, version={})",
                chore.getChoreId(), chore.getRewardPoints(), demoRoom.getAvailablePoints(), version);
        return ChoreCompletionResult.COMPLETED;
    }

    public synchronized RugUnlockResult unlockRug() {
        if (unlockedItemIds.contains("rug")) {
            log.info("Rug is already unlocked");
            return RugUnlockResult.ALREADY_UNLOCKED;
        }
        if (!demoRoom.spendPoints(RUG_COST)) {
            log.info("Cannot unlock rug: insufficient points (required={}, available={})",
                    RUG_COST, demoRoom.getAvailablePoints());
            return RugUnlockResult.INSUFFICIENT_POINTS;
        }

        unlockedItemIds.add("rug");
        version++;
        log.info("Unlocked rug for {} points (remaining={}, version={})",
                RUG_COST, demoRoom.getAvailablePoints(), version);
        return RugUnlockResult.UNLOCKED;
    }

    public synchronized void resetDemo() {
        demoRoom.getChores().forEach(RoomChore::resetCompletion);
        demoRoom.resetPoints();
        unlockedItemIds.clear();
        version = 2;
        log.info("Demo room state reset (version={})", version);
    }

    private HomePetRoom createDemoRoom() {
        HomePet pet = new HomePet("Mochi", "beaver");
        List<RoomChore> chores = Arrays.stream(ChoreEnum.values())
                .map(chore -> new RoomChore(
                        chore.getId(),
                        chore.getName(),
                        chore.getPoints(),
                        true
                ))
                .toList();

        return new HomePetRoom("demo", "EmWiMi House", pet, chores, 0);
    }

    private LocalDate today() {
        return LocalDate.now(ROOM_ZONE);
    }

    public enum ChoreCompletionResult {
        COMPLETED,
        ALREADY_COMPLETED,
        UNKNOWN_CHORE,
        DISABLED
    }

    public enum RugUnlockResult {
        UNLOCKED,
        ALREADY_UNLOCKED,
        INSUFFICIENT_POINTS
    }
}