# The Cookie Isle Website

Welcome to The Cookie Isle website repository! This guide will walk you through everything you need to know to update and maintain your bakery website, even if you've never worked with code before.

---

## Table of Contents

1. [Opening the Project in VS Code](#1-opening-the-project-in-vs-code)
2. [Getting the Latest Changes (Fetch & Pull)](#2-getting-the-latest-changes-fetch--pull)
3. [Understanding the hugo.toml File](#3-understanding-the-hugotoml-file)
4. [Working with Cookie Menu Items](#4-working-with-cookie-menu-items)
5. [Previewing Your Changes Locally](#5-previewing-your-changes-locally)
6. [Saving and Publishing Your Changes](#6-saving-and-publishing-your-changes)
7. [Common Tasks Quick Reference](#7-common-tasks-quick-reference)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Opening the Project in VS Code

### If the project is already cloned to your Mac:

1. **Open VS Code**
   - Find VS Code in your Applications folder, or use Spotlight (press `Cmd + Space`, type "VS Code", press Enter)

2. **Open the project folder**
   - Click **File** → **Open Folder...** (or press `Cmd + O`)
   - Navigate to where the `cookie-isle` folder is saved
   - Select the `cookie-isle` folder and click **Open**

3. **You should see the project files**
   - On the left sidebar, you'll see all the files and folders
   - Look for `hugo.toml` and the `content` folder

---

## 2. Getting the Latest Changes (Fetch & Pull)

Before making any changes, always get the latest version from GitHub. This is especially important if someone else might have made changes.

### Using VS Code's Git Panel:

1. **Open the Source Control panel**
   - Click the **Source Control icon** in the left sidebar (it looks like a branch/fork symbol)
   - Or press `Ctrl + Shift + G`

2. **Fetch the latest changes**
   - Click the **three dots menu (···)** at the top of the Source Control panel
   - Select **Pull, Push** → **Fetch**
   - This checks if there are any new changes on GitHub

3. **Pull the changes**
   - Click the **three dots menu (···)** again
   - Select **Pull, Push** → **Pull**
   - This downloads any new changes to your computer

4. **You're now up to date!**
   - If you see a message like "Already up to date" that's fine—it just means there were no new changes

---

## 3. Understanding the hugo.toml File

The `hugo.toml` file is the main settings file for your website. It controls everything from your business information to your site's colors.

### Opening hugo.toml:

1. In VS Code's file explorer (left sidebar), click on `hugo.toml`
2. The file will open in the main editor area

### File Organization:

The file is organized into sections (most important at the top):

| Section | What It Controls |
|---------|------------------|
| **Section 1: Basic Site Information** | Site title, description |
| **Section 2: Contact Information** | Email, phone, address, hours |
| **Section 3: Social Media Links** | Facebook, Instagram URLs |
| **Section 4: Coming Soon Mode** | Toggle between "Coming Soon" page and full site |
| **Section 5: Images and Branding** | Logo, hero decorative images |
| **Section 6: Buttons and Links** | Where the "Order Now" button links to |
| **Section 7: Color Scheme** | All website colors |
| **Section 8: Navigation Menu** | Main menu links |
| **Section 9: Technical Settings** | ⚠️ Rarely need to change these |

### Common Changes You Might Make:

#### Changing Contact Information:
```toml
email = "hello@thecookieisle.com"
phone = "(555) 123-COOKIE"
address = "123 Baker Street, Sweet Town, CA 90210"
```

#### Updating Business Hours:
```toml
hours = [
  "Mon-Fri: 7am - 6pm",
  "Saturday: 8am - 5pm",
  "Sunday: 9am - 2pm"
]
```

#### Launching Your Full Site (Turning Off "Coming Soon"):
Find this line and change `true` to `false`:
```toml
coming_soon = false
```

#### Updating Social Media Links:
```toml
facebook = "https://facebook.com/yournewpage"
instagram = "https://instagram.com/yournewprofile"
```

---

## 4. Working with Cookie Menu Items

Cookie menu items are stored as individual files in the `content/menu/` folder.

### Understanding Cookie Files:

Each cookie has its own `.md` (Markdown) file with two parts:

1. **Front Matter** (between the `+++` marks) - The cookie's details like title, price, image
2. **Content** (after the second `+++`) - The full description shown on the cookie's detail page

### Example Cookie File Structure:

```md
+++
title = 'Chocolate Chip'
date = '2025-11-28T13:12:28-08:00'
draft = false
featured = true
price = "$3.50"
description = "Our classic chocolate chip cookie loaded with premium semi-sweet chocolate chips."
image = "Cholocatechipsingle.png"
hero_image = "Cholocatechipmultiple.png"
ingredients = "Butter, flour, brown sugar, eggs, vanilla, semi-sweet chocolate chips, sea salt"
tags = ["classic", "chocolate", "bestseller"]
weight = 1
+++

The cookie that started it all. Our classic chocolate chip cookie features a perfect balance of crispy edges and a soft, chewy center.
```

### Key Fields Explained:

| Field | What It Does |
|-------|--------------|
| `title` | Cookie name displayed on the site |
| `draft` | `true` = hidden, `false` = visible on site |
| `featured` | `true` = shows on homepage, `false` = menu page only |
| `price` | Price shown on menu card (include $) |
| `description` | Short text on menu card (1-2 sentences) |
| `image` | Small image for menu grid (filename only) |
| `hero_image` | Large image for detail page (optional) |
| `ingredients` | Comma-separated ingredient list |
| `tags` | Categories like "classic", "seasonal", "bestseller" |
| `weight` | Display order (1 = first, 2 = second, etc.) |

---

### Method A: Creating a New Cookie by Duplicating an Existing File

**This is the easiest method for beginners!**

1. **Find an existing cookie file**
   - In VS Code, expand `content` → `menu` in the left sidebar
   - Right-click on an existing cookie file (like `cholocatechip.md`)

2. **Duplicate the file**
   - Select **Copy**
   - Right-click on the `menu` folder
   - Select **Paste**
   - You'll now have a copy named something like `cholocatechip copy.md`

3. **Rename the file**
   - Right-click the copied file
   - Select **Rename**
   - Type a new name using lowercase letters and hyphens (no spaces!)
   - Example: `peanut-butter.md`, `snickerdoodle.md`, `double-chocolate.md`

4. **Edit the content**
   - Click on your new file to open it
   - Update ALL the fields with your new cookie's information
   - Don't forget to update the title, price, description, etc.

---

### Method B: Creating a New Cookie Using Hugo Command

**This method uses the terminal but ensures proper formatting.**

1. **Open VS Code's built-in terminal**
   - Click **Terminal** → **New Terminal** from the menu bar
   - Or press `` Ctrl + ` `` (the backtick key, usually below Escape)

2. **Run the Hugo new content command**
   - Type the following command (replace `your-cookie-name` with your cookie's name using hyphens):
   ```bash
   hugo new content content/menu/your-cookie-name.md
   ```
   - Example for a Peanut Butter cookie:
   ```bash
   hugo new content content/menu/peanut-butter.md
   ```
   - Press **Enter**

3. **Open and edit the new file**
   - The new file will appear in `content/menu/`
   - Click on it to open and fill in all the details
   - The file comes pre-filled with placeholder content from the template

4. **Important: Set draft to false when ready**
   - New files are created with `draft = true`
   - Change to `draft = false` when you want the cookie to appear on the site

---

### Editing an Existing Cookie:

1. Navigate to `content/menu/` in the VS Code sidebar
2. Click on the cookie file you want to edit (e.g., `cholocatechip.md`)
3. Make your changes in the editor
4. Save the file (`Cmd + S`)

### Adding Cookie Images:

1. **Prepare your images**
   - Use PNG or JPG format
   - Recommended size: 800x600 pixels for menu cards
   - Name files without spaces (use hyphens): `peanut-butter-single.png`

2. **Add images to the static folder**
   - In Finder, navigate to the `cookie-isle/static/` folder
   - Drag and drop your image files into this folder

3. **Reference the image in your cookie file**
   - Use just the filename (no path needed):
   ```toml
   image = "peanut-butter-single.png"
   hero_image = "peanut-butter-multiple.png"
   ```

---

## 5. Previewing Your Changes Locally

Before publishing, always preview your changes to make sure everything looks right!

### Starting the Local Preview Server:

1. **Open the terminal in VS Code**
   - Click **Terminal** → **New Terminal**
   - Or press `` Ctrl + ` ``

2. **Start Hugo's development server**
   - Type this command and press Enter:
   ```bash
   hugo serve
   ```

3. **Open the preview in your browser**
   - Look for a line in the terminal that says something like:
   ```
   Web Server is available at http://localhost:1313/
   ```
   - **Hold Cmd and click** on the URL, OR
   - Open your web browser and go to: `http://localhost:1313/`

4. **View your changes**
   - The website will update automatically as you save files!
   - Check that everything looks correct

5. **Stop the server when done**
   - Click in the terminal
   - Press `Ctrl + C` to stop the server

---

## 6. Saving and Publishing Your Changes

Once you're happy with your changes, follow these steps to publish them to the live website.

### Step 1: Save All Your Files

- Press `Cmd + S` to save the current file
- Or press `Cmd + Option + S` to save all open files
- Look for white dots on file tabs—these indicate unsaved changes

### Step 2: Stage Your Changes

1. **Open Source Control**
   - Click the **Source Control icon** in the left sidebar
   - You'll see a list of changed files under "Changes"

2. **Stage all changes**
   - Hover over "Changes" and click the **+ icon** to stage all files
   - Or click the **+** next to individual files to stage them one at a time

### Step 3: Write a Commit Message

1. **In the "Message" box at the top**, type a brief description of what you changed
   - Good examples:
     - "Updated business hours"
     - "Added new Peanut Butter cookie"
     - "Changed coming_soon to false for launch"
     - "Updated phone number and email"

### Step 4: Commit Your Changes

1. Click the **✓ Commit** button (checkmark)
   - This saves your changes to Git's history

### Step 5: Push to GitHub

1. Click the **three dots menu (···)** at the top of Source Control
2. Select **Push**
3. Wait for the push to complete

### Step 6: Verify Deployment

- Your changes will automatically deploy to the live site via GitHub Actions
- Wait 1-2 minutes, then refresh your live website to see the changes
- If using "Coming Soon" mode, remember you need to view the full site to see menu changes

---

## 7. Common Tasks Quick Reference

### Change Business Hours
📁 File: `hugo.toml`  
🔍 Find: `hours = [`  
✏️ Edit the lines between the brackets

### Update Contact Email
📁 File: `hugo.toml`  
🔍 Find: `email =`  
✏️ Change the email address in quotes

### Launch Full Site (Turn Off Coming Soon)
📁 File: `hugo.toml`  
🔍 Find: `coming_soon = true`  
✏️ Change `true` to `false`

### Add a New Cookie
📁 Folder: `content/menu/`  
✏️ Duplicate existing file OR run `hugo new content content/menu/cookie-name.md`

### Change Cookie Price
📁 File: `content/menu/[cookie-name].md`  
🔍 Find: `price =`  
✏️ Update the price (keep the quotes and $)

### Feature/Unfeature a Cookie
📁 File: `content/menu/[cookie-name].md`  
🔍 Find: `featured =`  
✏️ Change to `true` (homepage) or `false` (menu only)

### Hide a Cookie Temporarily
📁 File: `content/menu/[cookie-name].md`  
🔍 Find: `draft =`  
✏️ Change to `true` to hide, `false` to show

### Change Website Colors
📁 File: `hugo.toml`  
🔍 Find: `[params.colors]`  
✏️ Update the hex color codes (use https://htmlcolorcodes.com/ to find colors)

---

## 8. Troubleshooting

### "hugo serve" doesn't work

**Make sure Hugo is installed:**
```bash
hugo version
```
If you get "command not found", Hugo needs to be installed:
```bash
brew install hugo
```

### Changes don't appear on the live site

1. Did you **save** the file? (`Cmd + S`)
2. Did you **commit** the changes?
3. Did you **push** to GitHub?
4. Wait 1-2 minutes for GitHub Actions to deploy
5. Hard refresh your browser (`Cmd + Shift + R`)

### Cookie doesn't appear on the site

Check these settings in your cookie's `.md` file:
- `draft = false` (not `true`)
- `featured = true` if you want it on homepage
- The file is saved in `content/menu/` folder

### Images don't show up

1. Make sure the image file is in the `static/` folder
2. Check that the filename in your cookie file matches exactly (case-sensitive!)
3. Don't include the path, just the filename: `image = "myimage.png"`

### "Merge conflict" error

This happens when someone else changed the same file. Ask for help from someone with Git experience, or:
1. Save your changes somewhere (copy the text)
2. Discard your local changes
3. Pull the latest version
4. Re-apply your changes

---

## Need More Help?

- **Hugo Documentation:** https://gohugo.io/documentation/
- **Markdown Guide:** https://www.markdownguide.org/basic-syntax/
- **VS Code Tips:** https://code.visualstudio.com/docs/getstarted/tips-and-tricks

---

*Last updated: 2025*