package com.homepets.backend.controller;

import com.homepets.backend.dto.RoomSnapshotDTO;
import com.homepets.backend.service.RoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/rooms/demo")
@CrossOrigin(origins = "*")
public class RoomController {

    private static final Logger log = LoggerFactory.getLogger(RoomController.class);

    private final RoomService roomService;

    // Stores all connected SSE emitters (thread-safe)
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    // 1. Add: SSE real-time broadcast subscription endpoint
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        // Set timeout to 30 minutes
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        emitters.add(emitter);

        log.info("New device connected to SSE, current connection count: {}", emitters.size());

        // Remove the emitter automatically when the connection completes or times out
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));

        // As soon as the connection is established, push the current state once
        try {
            emitter.send(SseEmitter.event().name("room-update").data(roomService.getSnapshot()));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    // 2. Broadcast the latest room state to all subscribed clients
    private void broadcastSnapshot() {
        RoomSnapshotDTO snapshot = roomService.getSnapshot();
        log.info("Broadcasting the latest state to {} devices (version={})", emitters.size(), snapshot.getVersion());

        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("room-update")
                        .data(snapshot));
            } catch (Exception e) {
                log.warn("Broadcast failed; marking inactive connection: {}", e.getMessage());
                deadEmitters.add(emitter);
            }
        }

        // Remove invalid connections in a single batch
        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            log.info("Cleaned up {} invalid SSE connections; remaining connections: {}", deadEmitters.size(), emitters.size());
        }
    }

    @GetMapping
    public ResponseEntity<RoomSnapshotDTO> getRoomState() {
        return ResponseEntity.ok(roomService.getSnapshot());
    }

    @PostMapping("/chores/{choreId}/complete")
    public ResponseEntity<?> completeChore(@PathVariable String choreId) {
        RoomService.ChoreCompletionResult result = roomService.completeChore(choreId);
        if (result == RoomService.ChoreCompletionResult.UNKNOWN_CHORE) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Map.of("error", "Unknown chore ID: " + choreId));
        }
        if (result == RoomService.ChoreCompletionResult.DISABLED) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("error", "Chore is disabled: " + choreId));
        }

        if (result == RoomService.ChoreCompletionResult.COMPLETED) {
            log.info("Successfully completed chore [{}], triggering broadcast", choreId);
            broadcastSnapshot();
        }

        return ResponseEntity.ok(roomService.getSnapshot());
    }

    @PostMapping("/rewards/{rewardId}/unlock")
    public ResponseEntity<?> unlockReward(@PathVariable String rewardId) {
        // unlock method
        RoomService.RewardUnlockResult result =
                roomService.unlockReward(rewardId);

        // UNKNOWN_REWARD
        if (result == RoomService.RewardUnlockResult.UNKNOWN_REWARD) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of(
                            "error",
                            "Unknown reward ID: " + rewardId
                    ));
        }

        // INSUFFICIENT_POINTS
        if (result == RoomService.RewardUnlockResult.INSUFFICIENT_POINTS) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of(
                            "error",
                            "Insufficient points."
                    ));
        }

        // successfully unlock
        if (result == RoomService.RewardUnlockResult.UNLOCKED) {
            log.info(
                    "Reward [{}] unlocked successfully, triggering broadcast",
                    rewardId
            );
            broadcastSnapshot();
        }

        return ResponseEntity.ok(roomService.getSnapshot());
    }

    @PostMapping("/reset")
    public ResponseEntity<RoomSnapshotDTO> resetDemo() {
        roomService.resetDemo();
        log.info("State reset, triggering broadcast");

        broadcastSnapshot();
        return ResponseEntity.ok(roomService.getSnapshot());
    }
}