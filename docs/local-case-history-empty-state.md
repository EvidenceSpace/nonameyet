# Local case history and empty-library recovery

CaseFind stores a content-free local marker after a case has been saved successfully, restored successfully, or observed in the local library. The marker contains only a format version plus the first and latest recorded storage timestamps. It never contains a case title, client, amount, file metadata, or other case content.

When the local database is empty and no marker exists, the library retains its ordinary first-use message. When the database is empty but the marker remains, the library explains that this browser profile previously stored at least one case. The message does not claim why cases are absent: permanent deletion, site-data clearing, and browser storage management are all presented as possibilities.

The historical empty state directs the user toward an encrypted `.casefind` backup, states that CaseFind cannot recover missing records automatically, and warns against clearing additional site data while checking. Failure to read or write the marker never blocks case creation, restoration, or library loading.
