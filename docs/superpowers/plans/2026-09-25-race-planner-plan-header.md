# Race Planner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive endurance race planning application with Canvas timeline, real-time iRacing telemetry, and full planning automation.

**Architecture:** Turborepo monorepo with three packages — shared (types, validation, automation), server (Node.js WebSocket, iRacing bridge, file storage, exports), and client (React + Vite with custom Canvas timeline). State managed by Zustand with temporal middleware for undo/redo. Single WebSocket connection multiplexed by message type.

**Tech Stack:** React, TypeScript, Vite, Zustand, Zod, Canvas HTML5, Node.js, ws, node-irsdk, pdfkit, vitest, Turborepo

**Spec:** `docs/superpowers/specs/2026-09-25-race-planner-design.md`

## Global Constraints

- TypeScript strict mode in all packages
- Node.js >= 20
- All shared types imported from `@race-planner/shared` — never duplicated
- Vitest for all tests
- Dark theme: background `#1a1a2e`, text `#e0e0e0`, accent `#f5a623`
- All user-facing text in French
- Times stored as "HH:mm" strings, durations as minutes (number)
- Lap times in seconds (number, decimal)
- UUIDs generated with `crypto.randomUUID()`

## Plan Structure

This plan is split into 4 phase files for manageability:

1. **Phase 1 — Foundation** (Tasks 1-5): `plan-phase1-foundation.md`
2. **Phase 2 — Canvas** (Tasks 6-10): `plan-phase2-canvas.md`
3. **Phase 3 — UI + Automation** (Tasks 11-15): `plan-phase3-ui-automation.md`
4. **Phase 4 — Export + Live** (Tasks 16-20): `plan-phase4-export-live.md`

Execute phases in order. Each task within a phase depends on prior tasks.
