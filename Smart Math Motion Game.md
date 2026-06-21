# Smart Math Motion Game

Version: 1.0
Project Type: Educational Motion Learning Platform
Primary Subject: Mathematics
Technology Stack: React + Vite + TypeScript + TailwindCSS + MediaPipe + Supabase + Vercel

---

# 1. Vision

Smart Math Motion Game คือเกมการศึกษาแบบ Interactive Learning ที่ผสมผสานระหว่างการเรียนรู้และการเคลื่อนไหวร่างกาย (Active Learning)

ผู้เรียนจะสามารถมองเห็นภาพของตนเองผ่านกล้อง Webcam แบบ Real-Time และใช้มือในการเลือกคำตอบแทนการใช้เมาส์หรือคีย์บอร์ด

ระบบต้องสร้างประสบการณ์ที่ใกล้เคียงเกมจริงมากที่สุด เพื่อให้ผู้เรียนรู้สึกสนุก ตื่นเต้น และอยากกลับมาเล่นซ้ำ

เป้าหมายคือเปลี่ยนการทำแบบฝึกหัดธรรมดาให้กลายเป็นประสบการณ์การเล่นเกม

---

# 2. Long-Term Vision

Phase 1:
Mathematics

Phase 2:
Thai Language

Phase 3:
English

Phase 4:
Science

Phase 5:
Social Studies

Phase 6:
AI Adaptive Learning

ระบบทั้งหมดต้องออกแบบเป็น Platform เพื่อรองรับหลายวิชาในอนาคต

---

# 3. Target Users

Primary:

* นักเรียนประถมศึกษา

Secondary:

* ครูผู้สอน
* โรงเรียน
* ศูนย์การเรียนรู้

Age Range:
6 - 12 Years

---

# 4. Core Gameplay

เมื่อผู้เล่นเปิดเกม

1. เปิดกล้อง Webcam
2. แสดงภาพผู้เล่นแบบ Real-Time
3. สุ่มโจทย์ 5 ข้อจากคลัง 50 ข้อ
4. แสดงตัวเลือก 4 คำตอบ
5. ใช้มือเลือกคำตอบ
6. คำนวณคะแนน
7. แสดงผลลัพธ์
8. สรุปผลเมื่อจบเกม

---

# 5. Active Learning Experience

ผู้เล่นต้องมองเห็นภาพตัวเองตลอดเวลา

ภาพจากกล้องจะเป็นส่วนหนึ่งของเกม

ผู้เล่นต้องรู้สึกเหมือนกำลังอยู่ภายในเกม

ตัวอย่างแนวคิด

* Mirror Mode
* Motion Learning
* Body Interaction
* Hand Control

---

# 6. Hand Tracking System

Technology:
MediaPipe Hand Tracking

Requirements:

* ตรวจจับมือแบบ Real-Time
* รองรับมือซ้ายและขวา
* ตรวจจับปลายนิ้วชี้
* ติดตามตำแหน่งนิ้ว
* รองรับ FPS สูง
* ทำงานบน Browser

Selection Method:

Hover Selection

เมื่อปลายนิ้วอยู่เหนือปุ่ม

เริ่มนับถอยหลัง

3
2
1

เลือกคำตอบอัตโนมัติ

---

# 7. Game Screen Layout

Background:
Live Camera Feed

Top Left:
Current Score

Top Right:
Question Counter

Center:
Question Area

Bottom:
Answer Choices

Overlay:
Hand Tracking Cursor

---

# 8. UI Design Requirements

Theme:
Modern Educational Arcade

Design Style:

* Friendly
* Colorful
* Modern
* Playful
* Interactive
* Child Friendly

Reference Style:

* Nintendo Learning Games
* Kahoot
* Duolingo
* Roblox Educational Games

Avoid:

* Traditional School Style
* Plain Forms
* Gray Corporate UI

---

# 9. Color System

Primary:
#2563EB

Secondary:
#06B6D4

Success:
#22C55E

Warning:
#F59E0B

Danger:
#EF4444

Accent:
#8B5CF6

Background:
#0F172A

Card:
#1E293B

Text:
#FFFFFF

---

# 10. Animation Requirements

Library:
Framer Motion

Animations:

* Floating Cards
* Bounce Effects
* Success Burst
* Coin Animation
* Combo Animation
* Score Pop-up
* Fireworks
* Confetti

Every interaction should feel alive.

No static screens.

---

# 11. Question System

Initial Question Bank:
50 Questions

Random Selection:
5 Questions per Match

Question Types:

* Addition
* Subtraction
* Multiplication
* Division

Future Expansion:

* Word Problems
* Fractions
* Decimals
* Geometry

---

# 12. Scoring System

Correct Answer:
+10

Speed Bonus:
+5

Combo Bonus:
+2

Perfect Round:
+20

Maximum Score:
75

---

# 13. Combo System

2 Correct:
Combo x2

3 Correct:
Combo x3

4 Correct:
Combo x4

5 Correct:
Combo x5

Display Large Visual Effects

---

# 14. Achievement System

Bronze

Silver

Gold

Platinum

Diamond

Master

Legend

---

# 15. End Game Summary

Display:

* Total Score
* Correct Answers
* Wrong Answers
* Accuracy
* Time Used
* Earned Badge
* Rank

Show Celebration Screen

Fireworks

Confetti

Victory Sound

---

# 16. Audio System

Correct Answer Sound

Wrong Answer Sound

Countdown Sound

Achievement Sound

Victory Sound

Background Music

Mute Option Required

---

# 17. Database Design

Supabase

Tables:

subjects

questions

choices

students

game_sessions

scores

achievements

leaderboards

---

# 18. Future Subject Expansion

Architecture must support:

Mathematics

Thai Language

English

Science

Social Studies

Without changing existing game engine

Only question data should change

---

# 19. Teacher Dashboard

Features:

* Student Scores
* Top Rankings
* Subject Statistics
* Accuracy Analysis
* Question Analysis
* Classroom Report

---

# 20. Technical Stack

Frontend:
React
Vite
TypeScript

UI:
TailwindCSS
shadcn/ui

Animation:
Framer Motion

Hand Tracking:
MediaPipe

Backend:
Supabase

Authentication:
Supabase Auth

Hosting:
Vercel

Source Control:
GitHub

---

# 21. Development Phases

Phase 1:
Project Setup

* React
* Vite
* Tailwind
* Supabase

Deliverable:
Running Project

---

Phase 2:
Game UI

* Home Screen
* Game Screen
* Result Screen

Deliverable:
Playable UI

---

Phase 3:
Camera Integration

* Webcam
* Live Feed

Deliverable:
Live Camera Background

---

Phase 4:
Hand Tracking

* MediaPipe
* Finger Detection
* Hover Selection

Deliverable:
Playable Without Mouse

---

Phase 5:
Question Engine

* Random Questions
* Score Calculation

Deliverable:
Complete Gameplay

---

Phase 6:
Animation & Audio

* Effects
* Sounds
* Celebration

Deliverable:
Fun Experience

---

Phase 7:
Supabase Integration

* Save Scores
* Save Sessions

Deliverable:
Persistent Data

---

Phase 8:
Teacher Dashboard

Deliverable:
Learning Analytics

---

Phase 9:
Multi-Subject Platform

Deliverable:
Educational Game Platform

Completed:
- Question model supports `subject + category`
- Mathematics, Thai, and English question banks are separated
- Home screen can launch practice by subject/category without touching the game engine

---

# 22. Success Criteria

When a child sees the game for the first time

The child should immediately want to play.
The child should understand the controls without reading instructions.
The child should smile when seeing themselves on screen.
The learning experience should feel like playing a game, not doing homework.

Responsive Devices

The experience must work smoothly across:

* Desktop
* Laptop
* Tablet
* Mobile

The UI should adapt without breaking the game flow, camera view, or answer selection.
