---
title: "Blast Radius: parse a shell command instead of grepping it for danger"
published: false
tags: javascript, typescript, security, webdev
---

I kept noticing the same small moment: an AI coding agent hands me a shell one-liner, I glance at
it, and I run it. The glance is not really reading. `curl https://get.example.com/install.sh |
sudo bash` and `curl https://example.com | less` look about the same at a distance, and one of
them runs whatever a server decides to return, as root.

So I built [Blast Radius](https://apps.charliekrug.com/blast-radius/): paste a shell command, get
a plain-English breakdown of what it actually does before you run it. It is 100% client-side, no
backend, nothing you paste leaves the browser.

## The decision that shaped everything: parse, don't grep

The obvious way to build this is a list of scary regexes. Match `rm -rf`, match `sudo`, match
`curl | sh`. I did not want that, and the reason is one example: `rm -rf ./build` versus
`rm -rf /`. A blocklist trips on both, so it either warns on every build script until you stop
reading the warnings, or it loosens the pattern until it misses the real one. The word `rm` is not
the danger. The target is.

The only way to tell those two apart is to actually understand the command's structure, so Blast
Radius has a real (if small) shell front end:

1. A tokenizer splits the line into words and operators, handling quoting, escapes, `#` comments,
   and redirects.
2. A parser builds an AST: pipelines split on `|`, sequences joined by `;` / `&&` / `||`, each
   command carrying its typed redirects.
3. A rule engine walks that tree. Each rule is a plain function over parsed structure, never a
   regex over the raw string.

Now `rm -rf /` is danger because the parsed target is a filesystem root, and `rm -rf ./build` is a
routine caution, from the same rule, because the target is a relative path.

## The bug that made the parser earn its keep

The rule I was proudest of is `sudo` scope. Flagging the literal word `sudo` is useless noise:
`sudo apt update` is Tuesday. What matters is what `sudo` is escalating. So the sudo rule rebuilds
the effective inner command and re-runs the other rules against it. `sudo apt update` reads as a
routine admin caution; `sudo rm -rf /` compounds to danger because the thing being escalated is
itself catastrophic.

That is also where a sharp edge showed up. `sudo -u alice rm -rf /home/alice` has flags between
`sudo` and the real command, and `-u` takes a value. Skip flags naively and you treat `alice` as
the command name and miss the delete entirely. The fix was teaching the rule which sudo flags
consume a following value, the same problem `curl` has with `-H`, `-o`, and friends when you are
trying to find the actual URL among the arguments. Parsing does not make these cases free, but it
gives you a structured place to handle them instead of an ever-growing regex.

## Graceful degradation over false confidence

The worst thing a tool like this can do is print a calm "safe" on something it did not understand.
So an unterminated quote or an unsupported construct like process substitution never crashes and
never silently passes. You get whatever the tool could analyze, plus an explicit note that a part
could not be fully parsed. When the input has trailing garbage after a real danger, the analyzer
trims the malformed tail to recover the dangerous prefix instead of collapsing the whole verdict
to a shrug.

## What I would do differently

The grammar is deliberately small: no functions, no arithmetic, no here-docs. That is the right
call for v1, but it means a fork bomb defined as a shell function reads as safe, which bothers me.
The honest fix is more parser, not more regex, and that is the direction I would take it next.

Code and tests are on [GitHub](https://github.com/ctkrug/blast-radius). If you paste something it
gets wrong, I want to see it.
