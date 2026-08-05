# Motus Means Move

**The Motus Vision — the full investor pitch experience.**
Live at **[motus.mov/es/with-you](https://motus.mov/es/with-you)**.

This repo is the backup and working copy of everything that page is:

- **The Summoning** — "The Best Ideas Are Meant To Be Shared." The Davara orb
  emerges out of the artwork itself, circles the vision three times with
  lightning, and then Davara types the prospectus live.
- **Act II** — "August Is Writing." The founder rewrites the vision in plain
  words, key by key.
- **The Deck** — 47 slides. Davara.DEV, MotusMoves.US, Motus.Events, $MOTUS,
  Grow With Us, The Lincoln Park Room, and the door at the end. Every slide has
  its own frame and its own entrance. No two are alike.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole experience — styles, deck, and the fitting engine |
| `prospect.js` | The intro: the summoning, the orb ceremony, the live typing |
| `spark.js` | The lightning field |
| `sound.js` | The sound engine |
| `finale.js` | The closing sequence |
| `mind-mark.js` / `mind-mark.css` | The living MotusMind mark |
| `img/` | The artwork, the Lincoln Park Room photographs, the logos |

## Deploying

The page deploys as part of the `motus-mov-shortlink` Vercel project
(`vercel --prod` from that project root) and is served at `/es/with-you`
with every URL casing redirecting to the same page.

After any update here or there: **verify all three casings serve the same
bytes**, then push the changes back to this repo. This repo is the record.

---

Build In Public. Move The Mindset. **Motus Means Move.**
