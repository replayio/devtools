# DevTools Review Process

## As a submitter

### When to ask for a PR review

**Ask for a review unless you have a very good reason not to.**

- Reviews are beneficial for more than just making sure you're not about to ship bad code. It's a way for us to share knowledge with other people working on the same project regarding ongoing and/or planned changes. It's also one of the best opportunities for the submitter to learn from the reviewer, and vice versa.
- That said, there are situations that require things to move faster than we have time for. For example, if there was something obviously broken in the app and there's nobody available to review the PR before the problem escalates further. Though ideally these cases would be avoided, merging directly (without a PR review) is acceptable provided that the submitter does their best to mitigate the risk of causing even more errors. This can be done by extensively testing the change, and/or documenting the change in the PR such that it can be reverted easily if necessary.
- In general, we should err on the side of caution when merging new code and code reviews help increase confidence that we are not shipping bugs. This tendency can be relaxed once we have better tests in place, but until then, ask for a review unless you have good reason not to.

### How to ask for a PR review

**After adding the reviewer, mention them in Discord as a courtesy tap. Expect a <24 hour turnaround, and if you need it reviewed faster, make sure that you communicate it clearly to the reviewer.**

- We like to keep interruptions to a minimum, and so reviewing PRs are done when it's convenient for the reviewer. This varies between reviewers, but in general it's reasonable to expect a review to be done within 24 hours. When you ask for a review, make sure you assign the reviewer in the GitHub PR, as well as mention them in the appropriate Discord channel (e.g., "@JohnSmith can you take a look? [https://github.com/…](https://github.com/RecordReplay/devtools/pull/31415)") .
- Sometimes we need something reviewed faster for any variety of reasons. In those cases, it's on the submitter to communicate that to the reviewer. In general, being explicit and sending them a direct message should get the trick done. It's important the request is explicit and for the submitter to get some confirmation that the reviewer understand the urgency, to ensure that there is no miscommunication.
- There are ways to make the reviewer's job easier and it's preferable that these steps are taken before asking for the review. At this point they're not a requirement, but it's best practice to document the change to the best of our ability. Having a clear description of what the PR is doing and what the change's implications are helps. Recording a screencast of you walking through the PR makes it even better. And for full marks, you could include a replay of the before/after changes.

---

## As a reviewer

### How to review a PR

**Approving a PR means that you're satisfied with the PR and that the submitter (if they have merging privileges) can go ahead and merge when they're ready. "Request changes" should primarily be reserved for PR from an external contributor to be explicit about any changes that need to be made before their changes will be merged.**

- If reviewing a PR from an external contributor, make sure you merge it for them immediately after the PR has been approved.
- Another (rare) use case for request changes is when there are multiple reviewers on a PR and you believe that the current change should not be merged. In this case, you should block the PR from being merged. This way, a second reviewer cannot accidentally approve the PR without your concerns being addressed.

### How to leave helpful comments

**When leaving comments, make a clear distinction between an observation, vs a non-blocking nitpick, vs a blocking comment.**

- In general, style comments should not be blocking comments unless the reviewer feels strongly about it — in which case they should explicitly indicate the reasons for that opinion.
