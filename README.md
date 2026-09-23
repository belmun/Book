# 📖 StoryForge

A website that writes your story chapter by chapter from the details you give it:
plot, characters, genre, tone, POV, setting, rules and style. Everything is editable.

No server, no build step. It's plain HTML/CSS/JS.

## Run it
- **Locally:** open `index.html` in your browser.
- **Online (free):** push this repo to GitHub, then go to
  *Settings → Pages → Deploy from a branch → main / (root)*.
  Your site appears at `https://<you>.github.io/<repo>/`.

## Use it
1. Open **API key & model** and paste your Anthropic API key
   (get one at console.anthropic.com).
2. Fill in **Story** and **Characters**.
3. **Generate outline**, then edit or add chapters.
4. **Write** one chapter at a time or all at once. Edit the text, or add notes
   and hit Rewrite.
5. Download the story as Markdown, or save the project as JSON to load later.

## Privacy and cost
- Your key and story are saved in your browser (localStorage) and are sent only
  to Anthropic. Anyone using your deployed site must enter their own key.
- Only use it on your own device, since the key is handled in the browser.
- Writing uses your API credits.
