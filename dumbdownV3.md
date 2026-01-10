+++

/// DUMBDOWN V3

// What's Missing

The ability to convert, write and save in a dumbdown format is currently limited to copypasta into .txt. A frustration with Overleaf or Typst is cluttered, hyper-specific formatting that exists wrapped around latex for math. I can't hack that at all.

// What's Next

- a web interface with WYSIWYG editor that allows:
-- clutter free writing of dumbdown formatted docs with latex support
-- a preview pane much like Overleaf / Typst showing the doc formatted in normie HTML (i.e. converting /// to H1, etc.)
-- the import of .md trash (for starters), converting it to dumbdown
-- ability to export as .txt, .md or .pdf
- collab tool that allows:
-- secure sessions where people can share a UI for the copy & paste of code or commands
-- these should have unique session UUIDs
-- login via magic link as long as permissions match those invited to the session

// Design

The site will essentially have three components:

| DUMBDOWN | DUMBSCROLL | DUMBTEAM
    main     user UI       collab

Ridiculous names subject to change. DUMBSCROLL should be free forever but certain features should exist for a tiny nominal fee. Collab the same, but maybe have a cost model for larger teams or whatever.
                                                                                                                             +++