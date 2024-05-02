from bs4 import BeautifulSoup
import csv

# Load your HTML file
content = ""
try:
    with open('afspilningshistorik.html', 'r', encoding='utf-8') as file:
        content = file.read()
    print("HTML file loaded successfully.")
    print("Content length:", len(content))
except Exception as e:
    print(f"Failed to load HTML file: {e}")
    exit()

if not content:
    print("Error: HTML content is empty.")
    exit()

# Parse the HTML
try:
    soup = BeautifulSoup(content, 'lxml')
    print("HTML parsed successfully using lxml.")
except Exception as e:
    print(f"Error parsing HTML with lxml: {e}")
    exit()

# Find all video entries
try:
    video_entries = soup.find_all('div', class_='outer-cell mdl-cell mdl-cell--12-col mdl-shadow--2dp')
    print(f"Found {len(video_entries)} video entries.")
    if len(video_entries) == 0:
        print("No video entries found. Check the class names and HTML structure.")
        exit()
except Exception as e:
    print(f"Error finding video entries: {e}")
    exit()

# Additional print statements to track processing
print("Processing entries now...")

# Extract data and remove source_type from CSV output
import re  # Import regular expressions


# Extract data, separate date and time, and filter entries without a channel name
videos = []
for entry in video_entries:
    try:
        content_cell = entry.find('div', class_='content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1')
        caption_cell = entry.find('div', class_='content-cell mdl-cell mdl-cell--12-col mdl-typography--caption')
        
        links = content_cell.find_all('a')
        if links:
            title = links[0].text.strip()
            url = links[0]['href']
            # Use regular expression to find the date and time in the format "DD. MMM. YYYY, HH.MM.SS"
            datetime_pattern = re.compile(r'\d{1,2}\.\s[a-zA-Z]+\.\s\d{4},\s\d{1,2}\.\d{2}\.\d{2}')
            datetime_match = datetime_pattern.search(content_cell.text)
            if datetime_match:
                datetime_str = datetime_match.group(0)
                date_watched, time_watched = datetime_str.split(',')
                date_watched = date_watched.strip()
                time_watched = time_watched.strip()
            else:
                date_watched = "Unknown Date"
                time_watched = "Unknown Time"

            channel_name = links[1].text.strip() if len(links) > 1 else None

            if channel_name:  # Only add entries with a valid channel name
                videos.append({
                    'title': title,
                    'url': url,
                    'date_watched': date_watched,
                    'time_watched': time_watched,
                    'channel_name': channel_name
                })
                print(f"Processed video: {title} - Channel: {channel_name}")
    except Exception as e:
        print(f"Error processing entry: {e}")

# Write data to CSV, including separate date and time, excluding source_type
try:
    with open('watch_history.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['title', 'url', 'date_watched', 'time_watched', 'channel_name'])
        writer.writeheader()
        for video in videos:
            writer.writerow(video)
        print("CSV file written successfully.")
except Exception as e:
    print(f"Error writing CSV file: {e}")
