# import os
# import time
# import json
# import copy
# from selenium import webdriver
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from selenium.common.exceptions import TimeoutException

# class MySchemeScraper:
#     def __init__(self):
#         self.myscheme_url = 'https://rules.myscheme.in/'
#         self.save_path = os.path.join(os.path.dirname(__file__), 'myschemes_scraped_progress.json')

#         options = webdriver.FirefoxOptions()
#         options.add_argument("--headless")
#         self.options = options

#     # Get all scheme listing links
#     def get_scheme_links(self):
#         driver = webdriver.Firefox(options=self.options)
#         driver.get(self.myscheme_url)

#         WebDriverWait(driver, 30).until(EC.visibility_of_element_located((By.ID, "__next")))
#         result_elements = driver.find_element(By.ID, '__next').find_element(By.TAG_NAME, 'tbody').find_elements(By.TAG_NAME, 'tr')

#         scheme_links = []
#         for result_element in result_elements:
#             table_rows = result_element.find_elements(By.TAG_NAME, 'td')
#             scheme_data = {
#                 'sr_no': table_rows[0].text.strip(),
#                 'scheme_name': table_rows[1].text.replace('\nCheck Eligibility', '').strip(),
#                 'scheme_link': table_rows[2].find_element(By.TAG_NAME, 'a').get_attribute('href').strip()
#             }
#             scheme_links.append(scheme_data)

#         driver.quit()
#         print(f"[INFO] Found {len(scheme_links)} scheme links.")
#         return scheme_links

#     # Extract scheme details from each page
#     def get_scheme_details(self, scheme_links):
#         results = []

#         for idx, scheme in enumerate(scheme_links, start=1):
#             retries = 3
#             while retries > 0:
#                 try:
#                     driver = webdriver.Firefox(options=self.options)
#                     driver.get(scheme['scheme_link'])
#                     WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

#                     # --- Extract tags (Material-UI chips) ---
#                     tags = [t.text.strip() for t in driver.find_elements(By.CSS_SELECTOR, "span.MuiChip-label") if t.text.strip()]
#                     scheme["tags"] = tags

#                     # --- Extract sections dynamically ---
#                     def extract_section(keyword):
#                         try:
#                             el = driver.find_element(By.XPATH, f"//*[contains(text(), '{keyword}')]/following::div[1]")
#                             return el.text.strip()
#                         except:
#                             return ""

#                     scheme["details"] = extract_section("Details")
#                     scheme["benefits"] = extract_section("Benefits")
#                     scheme["eligibility"] = extract_section("Eligibility")
#                     scheme["application_process"] = extract_section("Application Process")
#                     scheme["documents_required"] = extract_section("Documents Required")

#                     print(f"[{idx}/{len(scheme_links)}] ✅ Scraped: {scheme['scheme_name']}")
#                     results.append(copy.deepcopy(scheme))
#                     driver.quit()
#                     break  # exit retry loop

#                 except TimeoutException:
#                     print(f"[WARN] Timeout on {scheme['scheme_name']} (Retrying...)")
#                     retries -= 1
#                     driver.quit()
#                     time.sleep(3)
#                 except Exception as e:
#                     print(f"[ERROR] {scheme['scheme_name']} failed: {e}")
#                     retries -= 1
#                     driver.quit()
#                     time.sleep(2)

#             if retries == 0:
#                 print(f"[SKIP] ❌ {scheme['scheme_name']} after 3 retries.")
#                 scheme['error'] = True
#                 results.append(copy.deepcopy(scheme))

#             # --- Autosave every 10 schemes ---
#             if idx % 10 == 0:
#                 with open(self.save_path, "w", encoding="utf-8") as f:
#                     json.dump(results, f, indent=2, ensure_ascii=False)
#                 print(f"[AUTO-SAVE] Progress saved after {idx} schemes.")

#         return results

#     # Merge scraped + structured data
#     def combine_myscheme_provided_and_scraped_data(self, scraped_scheme_details):
#         if not os.path.exists("myScheme-data.json"):
#             print("[WARN] myScheme-data.json not found, skipping merge.")
#             return scraped_scheme_details

#         myscheme_structured_data = json.load(open('myScheme-data.json', encoding="utf-8"))['hits']['hits']
#         individual_beneficiary_types = ['Individual', 'Family', 'Sportsperson', 'Journalist']

#         myscheme_structured_data = [
#             s for s in myscheme_structured_data
#             if any(i in individual_beneficiary_types for i in s['_source']['targetBeneficiaries'])
#         ]

#         required_fields = [
#             'schemeShortTitle', 'schemeCategory', 'schemeSubCategory', 'gender', 'minority',
#             'beneficiaryState', 'residence', 'caste', 'disability', 'occupation',
#             'maritalStatus', 'education', 'age', 'isStudent', 'isBpl'
#         ]

#         data_dict = {s['_source']['schemeName'].lower().strip(): s['_source'] for s in myscheme_structured_data}

#         combined = []
#         for s in scraped_scheme_details:
#             structured = data_dict.get(s['scheme_name'].lower().strip())
#             if structured:
#                 structured_info = {k: v for k, v in structured.items() if k in required_fields}
#                 s.update(structured_info)
#             combined.append(copy.deepcopy(s))

#         return combined


# if __name__ == '__main__':
#     scraper = MySchemeScraper()

#     # Step 1: Get scheme links
#     scheme_links = scraper.get_scheme_links()

#     # Step 2: Scrape details
#     scraped_scheme_details = scraper.get_scheme_details(scheme_links)

#     # Save scraped data
#     download_path = os.path.join(os.path.dirname(__file__), 'myschemes_scraped_final.json')
#     json.dump(scraped_scheme_details, open(download_path, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

#     # Step 3: Merge with structured myScheme data (if available)
#     combined_schemes_data = scraper.combine_myscheme_provided_and_scraped_data(scraped_scheme_details)
#     output_path = os.path.join(os.path.dirname(__file__), 'myschemes_scraped_combined_final.json')
#     json.dump(combined_schemes_data, open(output_path, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

#     print(f"\n✅ Completed. Saved {len(scraped_scheme_details)} schemes to {download_path}")
import os
import time
import json
import copy
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager


class MySchemeScraper:
    def __init__(self):
        self.myscheme_url = 'https://rules.myscheme.in/'
        self.save_path = os.path.join(os.path.dirname(__file__), 'myschemes_scraped_progress.json')

        chrome_options = Options()
        chrome_options.add_argument("--headless=new")   # headless mode
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-dev-shm-usage")
        self.options = chrome_options

    # ---------------- Get all scheme links ----------------
    def get_scheme_links(self):
        driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=self.options)
        driver.get(self.myscheme_url)

        WebDriverWait(driver, 30).until(EC.visibility_of_element_located((By.ID, "__next")))
        result_elements = driver.find_element(By.ID, '__next').find_element(By.TAG_NAME, 'tbody').find_elements(By.TAG_NAME, 'tr')

        scheme_links = []
        for result_element in result_elements:
            table_rows = result_element.find_elements(By.TAG_NAME, 'td')
            scheme_data = {
                'sr_no': table_rows[0].text.strip(),
                'scheme_name': table_rows[1].text.replace('\nCheck Eligibility', '').strip(),
                'scheme_link': table_rows[2].find_element(By.TAG_NAME, 'a').get_attribute('href').strip()
            }
            scheme_links.append(scheme_data)

        driver.quit()
        print(f"[INFO] Found {len(scheme_links)} scheme links.")
        return scheme_links

    # ---------------- Scrape details for each scheme ----------------
    def get_scheme_details(self, scheme_links):
        results = []

        for idx, scheme in enumerate(scheme_links, start=1):
            retries = 3
            while retries > 0:
                try:
                    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=self.options)
                    driver.get(scheme['scheme_link'])
                    WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

                    # --- Extract tags (Material UI chips) ---
                    tags = [t.text.strip() for t in driver.find_elements(By.CSS_SELECTOR, "span.MuiChip-label") if t.text.strip()]
                    scheme["tags"] = tags

                    # --- Generic section extractor ---
                    def extract_section(keyword):
                        try:
                            el = driver.find_element(By.XPATH, f"//*[contains(text(), '{keyword}')]/following::div[1]")
                            return el.text.strip()
                        except NoSuchElementException:
                            return ""

                    scheme["details"] = extract_section("Details")
                    scheme["benefits"] = extract_section("Benefits")
                    scheme["eligibility"] = extract_section("Eligibility")
                    scheme["application_process"] = extract_section("Application Process")
                    scheme["documents_required"] = extract_section("Documents Required")

                    print(f"[{idx}/{len(scheme_links)}] ✅ Scraped: {scheme['scheme_name']}")
                    results.append(copy.deepcopy(scheme))
                    driver.quit()
                    break

                except TimeoutException:
                    print(f"[WARN] Timeout on {scheme['scheme_name']} (Retrying...)")
                    retries -= 1
                    driver.quit()
                    time.sleep(3)
                except Exception as e:
                    print(f"[ERROR] {scheme['scheme_name']} failed: {e}")
                    retries -= 1
                    driver.quit()
                    time.sleep(2)

            if retries == 0:
                print(f"[SKIP] ❌ {scheme['scheme_name']} after 3 retries.")
                scheme['error'] = True
                results.append(copy.deepcopy(scheme))

            # --- Autosave every 10 schemes ---
            if idx % 10 == 0:
                with open(self.save_path, "w", encoding="utf-8") as f:
                    json.dump(results, f, indent=2, ensure_ascii=False)
                print(f"[AUTO-SAVE] Progress saved after {idx} schemes.")

        return results

    # ---------------- Merge scraped + structured myScheme JSON ----------------
    def combine_myscheme_provided_and_scraped_data(self, scraped_scheme_details):
        if not os.path.exists("myScheme-data.json"):
            print("[WARN] myScheme-data.json not found, skipping merge.")
            return scraped_scheme_details

        myscheme_structured_data = json.load(open('myScheme-data.json', encoding="utf-8"))['hits']['hits']
        individual_beneficiary_types = ['Individual', 'Family', 'Sportsperson', 'Journalist']

        myscheme_structured_data = [
            s for s in myscheme_structured_data
            if any(i in individual_beneficiary_types for i in s['_source']['targetBeneficiaries'])
        ]

        required_fields = [
            'schemeShortTitle', 'schemeCategory', 'schemeSubCategory', 'gender', 'minority',
            'beneficiaryState', 'residence', 'caste', 'disability', 'occupation',
            'maritalStatus', 'education', 'age', 'isStudent', 'isBpl'
        ]

        data_dict = {s['_source']['schemeName'].lower().strip(): s['_source'] for s in myscheme_structured_data}

        combined = []
        for s in scraped_scheme_details:
            structured = data_dict.get(s['scheme_name'].lower().strip())
            if structured:
                structured_info = {k: v for k, v in structured.items() if k in required_fields}
                s.update(structured_info)
            combined.append(copy.deepcopy(s))

        return combined


if __name__ == '__main__':
    scraper = MySchemeScraper()

    # Step 1: Get all scheme links
    scheme_links = scraper.get_scheme_links()

    # Step 2: Scrape all scheme details
    scraped_scheme_details = scraper.get_scheme_details(scheme_links)

    # Step 3: Save scraped data
    download_path = os.path.join(os.path.dirname(__file__), 'myschemes_scraped_final.json')
    json.dump(scraped_scheme_details, open(download_path, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

    # Step 4: Merge structured + scraped data (if available)
    combined_data = scraper.combine_myscheme_provided_and_scraped_data(scraped_scheme_details)
    output_path = os.path.join(os.path.dirname(__file__), 'myschemes_scraped_combined_final.json')
    json.dump(combined_data, open(output_path, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

    print(f"\n✅ Completed. Scraped {len(scraped_scheme_details)} schemes. Output saved to:")
    print(f" - Raw data: {download_path}")
    print(f" - Combined data: {output_path}")
