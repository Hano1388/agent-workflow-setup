## Ask the user to choose

After suggesting a branch name, use Cursor's AskQuestion tool
if it is available. Do not merely write the question in chat.

Question:
"Which branch name would you like to use?"

Choices:
1. "Use feature/SUGGESTED-NAME"
2. "Choose a different name"

Replace the example with the actual configured prefix and
suggested name. Allow a free-text response if the tool supports it.

If the user chooses a different name without supplying one,
ask them to type their preferred name, then wait.

If AskQuestion is unavailable, say so and ask in plain text:
"Reply yes to use feature/SUGGESTED-NAME,
or type your preferred branch name."

Wait for the answer. Do not fetch or create a branch until
the user has accepted or supplied a name.