function countryToAcronym(country) {
  if (!country) return '';
  const map = {
    'United States': 'USA',
    'United States of America': 'USA',
    'United Kingdom': 'UK',
    'Dubai': 'UAE',
    'Saudi Arabia': 'UAE',
    'UAE': 'UAE',
    'United Arab Emirates': 'UAE',
  };
  // Normalize for matching
  const normalized = country.trim();
  return map[normalized] || country;
}

function cleanCompanyName(companyRaw) {
  if (!companyRaw) return '';
  // Remove after "·" or any employment type keywords
  let company = companyRaw.split('·')[0].trim();
  // Remove common employment types if present
  company = company.replace(/\b(Full[- ]?time|Part[- ]?time|Contract|Internship|Temporary|Freelance|Self-employed|Remote)\b/gi, '').trim();
  // Remove trailing commas or dashes
  company = company.replace(/[-,]+$/, '').trim();
  return company;
}

function extractProfileDetails() {
  const fullName = document.querySelector('.v-align-middle.break-words')?.innerText?.trim() || '';
  const location = document.querySelector('.text-body-small.inline')?.innerText?.trim() || '';
  const locationParts = location.split(',').map(s => s.trim());
  const rawCountry = locationParts.length > 1 ? locationParts[locationParts.length - 1] : '';
  const country = countryToAcronym(rawCountry);
  const city = locationParts.length > 1 ? locationParts.slice(0, -1).join(', ') : location;

  const [firstName, ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ');
  const linkedinUrl = window.location.href;

  const { jobTitle, company: rawCompany } = extractLatestExperience();
  const company = cleanCompanyName(rawCompany);

  return {
    fullName,
    firstName,
    lastName,
    jobTitle,
    company, // cleaned company
    city,
    country, // acronym if applicable
    linkedinUrl
  };
}


function extractLatestExperience() {
  const experienceSections = [...document.querySelectorAll('section')];
  const experienceSection = experienceSections.find(sec =>
    sec.innerText.trim().startsWith("Experience")
  );
  if (!experienceSection) return {};

  const expItems = experienceSection.querySelectorAll('li');

  for (const item of expItems) {
    const isGrouped = item.querySelector('ul'); // nested jobs under a company

    if (isGrouped) {
      const companyElem = item.querySelector('span[aria-hidden="true"]');
      const company = companyElem?.innerText?.trim() || '';

      const nestedRoles = item.querySelectorAll('ul > li');

      for (const role of nestedRoles) {
        const spans = role.querySelectorAll('span[aria-hidden="true"]');
        const title = spans[0]?.innerText?.trim();
        const dateText = role.innerText.toLowerCase();
        const isPresent = dateText.includes('present');

        if (isPresent && title && title.length < 100) {
          return { jobTitle: title, company };
        }
      }
    } else {
      // flat experience, not grouped
      const spans = item.querySelectorAll('span[aria-hidden="true"]');
      const title = spans[0]?.innerText?.trim();
      const company = spans[1]?.innerText?.trim();
      const dateText = item.innerText.toLowerCase();
      const isPresent = dateText.includes('present');

      if (title && company && isPresent) {
        return { jobTitle: title, company };
      }
    }
  }

  // fallback: first valid non-present job
  for (const item of expItems) {
    const spans = item.querySelectorAll('span[aria-hidden="true"]');
    if (spans.length >= 2) {
      const title = spans[0]?.innerText?.trim();
      const company = spans[1]?.innerText?.trim();

      const isValidTitle = title && !/\d+\s+(yrs?|mos?|months?)/i.test(title) && title.length < 100;
      const isValidCompany = company && !/\d+\s+(yrs?|mos?|months?)/i.test(company) && company.length < 100;

      if (isValidTitle && isValidCompany) {
        return { jobTitle: title, company };
      }
    }
  }

  return {};
}







// Let the extension know the content script has loaded
console.log("LinkedIn CRM Checker content script loaded");

// Expose to popup
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    console.log("Message received in content script:", msg);
    
    if (msg.action === "getProfileData") {
        try {
            const data = extractProfileDetails();
            console.log("Sending profile data back to popup:", data);
            sendResponse(data);
        } catch (error) {
            console.error("Error extracting profile data:", error);
            sendResponse({ error: error.message });
        }
    }
    
    return true; // Keep the message channel open for async response
});
  