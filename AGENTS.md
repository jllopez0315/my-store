# For Any AI Agent Working in This Folder

Read `CLAUDE.md` first. It is the owner's full instruction file for this store: where everything lives, pricing rules, wording rules, and what never to do. Everything in it applies to you, whatever tool you are running in.

## Five hard rules

1. **No publish without approval.** Never commit to `main`, push, or tell the owner the folder is ready to upload until they type "publish," "push it," or "go live." Show the change first.
2. **Syntax check and preview before every publish.** Run `node --check` on every `.js` file you touched. Open every HTML page you touched in a local preview (`python3 -m http.server 8080` from the `store` folder) and confirm it renders. Show the owner. A typo once took a store page down. This is why.
3. **Never touch payment, legal, or the gate without asking.** `SETTINGS.payment`, `SETTINGS.gate`, `store/legal.html`, `SETTINGS.termsVersion`, `store/_worker.js`, environment variables, and `admin/setup.sql` are off limits unless the owner asks for that exact change and confirms it.
4. **Research use only, everywhere.** No dosing, protocols, health claims, or human-use language. Never call the store "compliant" or "legal." The store never takes card numbers.
5. **No new dependencies.** Plain HTML, CSS, and JavaScript only. No frameworks, libraries, trackers, build steps, or outside services.

When unsure, ask one short question. Never guess on prices, stock, payment details, or buyer-facing wording.
