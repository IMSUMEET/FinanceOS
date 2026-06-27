# Bugfix Checklist

- [ ] Reproduce the bug (test or steps documented)
- [ ] **Add regression test first** (or in same commit)
- [ ] Fix root cause — not symptoms
- [ ] Test fails before fix, passes after
- [ ] No unrelated changes
- [ ] `npm test` + affected test layers pass
- [ ] If golden output changed intentionally: `UPDATE_GOLDEN=1 npm run test:golden`
