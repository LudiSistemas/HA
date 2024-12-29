import requests
from bs4 import BeautifulSoup
import re
import json
import sys

def scrape():
    url = "http://www.bezstruje.com/?es=ED+Leskovac"
    target_location = "Негосавље"
    
    try:
        response = requests.get(url)
        response.encoding = 'utf-8'
        
        soup = BeautifulSoup(response.text, 'html.parser')
        content = soup.find('p', class_='text-warning')
        
        if not content:
            print(json.dumps({"found": False, "outages": []}))
            sys.exit(0)
            
        text = content.get_text()
        outages = []
        current_date = None
        current_time = None
        
        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            date_match = re.search(r'Петак|Субота|Недеља|Понедељак|Уторак|Среда|Четвртак.+?(\d{1,2}\.\d{2}\.)', line)
            if date_match:
                current_date = line.split(',')[1].strip()
                continue
            
            time_match = re.search(r'(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})', line)
            if time_match:
                current_time = line.strip()
                continue
            
            if target_location in line and current_date and current_time:
                outage = {
                    'date': current_date,
                    'time': current_time,
                    'description': line
                }
                outages.append(outage)
        
        result = {
            'found': bool(outages),
            'outages': outages
        }
        
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        print(json.dumps({"found": False, "outages": [], "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    scrape()