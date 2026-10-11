# Room: talking and calling inside the case

Status: **owner direction (11 October 2026), decision required on scope**. This updates the earlier record, which excluded native calls and described Room as text-first. The owner now wants people in a case to be able to call each other in the Room.

## Purpose

Room is where the people in a case talk: you, your lawyer, team members and, with limited access, witnesses. Conversations stay attached to the case instead of being scattered across email, WhatsApp and phone calls.

## What Room does

- **Chat** in threads, with mentions and attachments.
- **Point at the case:** a message can reference a card, frame, paper or point ("look at 08:42:06 on Joan's clip"), and clicking it opens that exact place.
- **Voice and video calls** inside the case.
- **Calling notification:** "Dana is calling you in the Room". It appears as an in-app call banner and an OS notification, with Join and Decline. Missed calls leave a note in the Room.
- **After a call:** the call becomes an entry in the Room with time, length and people. Optional notes and **decisions** can be saved, for example "Agreed: send the letter Friday". Decisions show up in the case history and can become tasks.
- **Recording and transcripts:** only with everyone's consent, clearly shown. Off by default. Decision required (legal and privacy review).
- **Guests** (witnesses, experts): invited to one thread or one request. They can upload and answer without seeing the rest of the case.
- **Requests:** structured asks such as "Joan, please send the original dashcam file". They have a status (sent, seen, done) and feed into holes on the board.
- **Shared case AI** (optional, labelled): summarises a thread or drafts a reply. It never sends anything itself.

## Rules

- Payment never grants case access. Booking a lawyer doesn't add them to the Room; the client invites them.
- Every member sees who else is in the Room.
- Guests never see the board, other threads or documents they weren't sent.
- Privilege: lawyer–client threads are marked and kept separate from guest threads.

## Building it (later stage)

Calls need a real-time media service (WebRTC through a provider), plus TURN servers, consent handling and recording storage if allowed. This is a later slice, after the core case model. The first step is chat, requests and calling notifications with links to an external call, then native calls.
