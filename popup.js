document.addEventListener('DOMContentLoaded', function () {
  const statusElement = document.getElementById('status');
  statusElement.textContent = 'Loading...';
  statusElement.style.display = 'block';

  let profileData = null;

  // Check if user is authenticated
  chrome.storage.sync.get("accessToken", ({ accessToken }) => {
    if (!accessToken) {
      window.location.href = "login.html";
      return;
    }

    // Check if we have a saved "Added By" name
    checkSavedAddedBy();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];

      if (currentTab && currentTab.url.includes('linkedin.com/in/')) {
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content.js']
        }).then(() => {
          chrome.tabs.sendMessage(currentTab.id, { action: "getProfileData" }, function (response) {
            statusElement.style.display = 'none';

            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              document.getElementById('contactInfo').innerHTML =
                '<p>Error connecting to the page. Please refresh the LinkedIn page and try again.</p>';
              document.getElementById('checkStatus').disabled = true;
              return;
            }

            if (response) {
              profileData = response;
              displayProfileData(profileData);
              document.getElementById('checkStatus').disabled = false;
            } else {
              document.getElementById('contactInfo').innerHTML =
                '<p>Could not extract profile data. Please refresh the LinkedIn page and try again.</p>';
              document.getElementById('checkStatus').disabled = true;
            }
          });
        }).catch(err => {
          console.error('Error injecting content script:', err);
          statusElement.style.display = 'none';
          document.getElementById('contactInfo').innerHTML =
            '<p>Error loading extension script. Please try again.</p>';
          document.getElementById('checkStatus').disabled = true;
        });
      } else {
        statusElement.style.display = 'none';
        document.getElementById('contactInfo').innerHTML =
          '<p>Please navigate to a LinkedIn profile to check contact status.</p>';
        document.getElementById('checkStatus').disabled = true;
      }
    });
  });

  document.getElementById('checkStatus').addEventListener('click', checkContactStatus);
  document.getElementById('saveContact').addEventListener('click', handleSaveContact);
  document.getElementById('confirmAddContact').addEventListener('click', saveContactWithAddedBy);
  document.getElementById('cancelAddContact').addEventListener('click', hideAddedByForm);
  document.getElementById('editAddedBy').addEventListener('click', showEditAddedByForm);

  function checkSavedAddedBy() {
    const savedAddedBy = localStorage.getItem('addedByName');
    if (savedAddedBy) {
      // We have a saved name, show it with edit option
      document.getElementById('savedAddedByName').textContent = savedAddedBy;
      document.getElementById('addedByDisplay').style.display = 'flex';
      // Also populate the input field in case user wants to edit
      document.getElementById('addedBy').value = savedAddedBy;
    }
  }

  function handleSaveContact() {
    const savedAddedBy = localStorage.getItem('addedByName');
    
    // Hide and clear success messages
    document.getElementById('existsMessage').innerHTML = 'Contact already exists in CRM';
    document.getElementById('existsMessage').style.display = 'none';
    document.getElementById('savedMessage').innerHTML = 'Contact saved successfully!';
    document.getElementById('savedMessage').style.display = 'none';
    
    if (savedAddedBy) {
      // If we already have a saved name, use it directly
      saveContact(savedAddedBy);
    } else {
      // Otherwise show the form to collect the name
      showAddedByForm();
    }
  }

  function checkContactStatus() {
    if (!profileData) {
      statusElement.className = 'error';
      statusElement.textContent = 'Error: No profile data available.';
      statusElement.style.display = 'block';
      return;
    }

    statusElement.className = '';
    statusElement.textContent = 'Checking contact status...';
    statusElement.style.display = 'block';
    
    // Clear any previous success messages
    document.getElementById('existsMessage').innerHTML = 'Contact already exists in CRM';
    document.getElementById('existsMessage').style.display = 'none';
    document.getElementById('savedMessage').innerHTML = 'Contact saved successfully!';
    document.getElementById('savedMessage').style.display = 'none';

    const checkData = {
      fullName: profileData.fullName || '',
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || ''
    };

    chrome.storage.sync.get("accessToken", ({ accessToken }) => {
      fetch('https://apitest.sales-buddy.in/api/contact/checkContactExists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify(checkData)
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(errorData => {
              throw new Error(errorData.error || 'Failed to check contact status');
            });
          }
          return response.json();
        })
        .then(data => {
          statusElement.style.display = 'none';

          if (data.success) {
            if (data.exists) {
              document.getElementById('checkStatus').style.display = 'none';
              
              // Clear any previous content in the exists message
              const existsMessageElement = document.getElementById('existsMessage');
              existsMessageElement.innerHTML = 'Contact already exists in CRM';
              existsMessageElement.style.display = 'block';
              
              // Add a link to view the contact details
              const viewContactLink = document.createElement('a');
              viewContactLink.href = `https://test.sales-buddy.in/singleContact?fullName=${encodeURIComponent(profileData.fullName)}`;
              viewContactLink.target = '_blank';
              viewContactLink.className = 'view-contact-btn';
              viewContactLink.textContent = 'View Contact Details';
              existsMessageElement.appendChild(document.createElement('br'));
              existsMessageElement.appendChild(viewContactLink);
              
              document.getElementById('savedMessage').style.display = 'none';
            } else {
              document.getElementById('checkStatus').style.display = 'none';
              document.getElementById('saveContact').style.display = 'block';
              document.getElementById('existsMessage').style.display = 'none';
              document.getElementById('savedMessage').style.display = 'none';
            }
          } else {
            statusElement.className = 'error';
            statusElement.textContent = 'Error checking contact status.';
            statusElement.style.display = 'block';
          }
        })
        .catch(error => {
          statusElement.className = 'error';
          statusElement.textContent = 'Error: ' + error.message;
          statusElement.style.display = 'block';
          console.error('API Error:', error);
        });
    });
  }
  
  function showAddedByForm() {
    // Hide the save button
    document.getElementById('saveContact').style.display = 'none';
    // Show the "Added By" form
    document.getElementById('addedByContainer').style.display = 'block';
  }
  
  function showEditAddedByForm() {
    // Hide the display
    document.getElementById('addedByDisplay').style.display = 'none';
    // Show the form for editing
    document.getElementById('addedByContainer').style.display = 'block';
    // Hide the save button while editing
    document.getElementById('saveContact').style.display = 'none';
  }
  
  function hideAddedByForm() {
    // Check if we have a saved name
    const savedAddedBy = localStorage.getItem('addedByName');
    if (savedAddedBy) {
      // If we have a saved name, show the display
      document.getElementById('addedByDisplay').style.display = 'flex';
    }
    
    // Show the save button again
    document.getElementById('saveContact').style.display = 'block';
    // Hide the "Added By" form
    document.getElementById('addedByContainer').style.display = 'none';
  }
});

function generateRandomEmail() {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com', 'mail.com'];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let username = '';
  const usernameLength = 8 + Math.floor(Math.random() * 8);
  for (let i = 0; i < usernameLength; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestamp = new Date().getTime().toString().slice(-6);
  return `${username}${timestamp}@${randomDomain}`;
}

function displayProfileData(data) {
  let html = '';
  if (data.firstName && data.lastName) {
    html += '<p><strong>Name:</strong> ' + data.firstName + ' ' + data.lastName + '</p>';
  } else if (data.fullName) {
    html += '<p><strong>Name:</strong> ' + data.fullName + '</p>';
  }
  if (data.jobTitle) html += '<p><strong>Job Title:</strong> ' + data.jobTitle + '</p>';
  if (data.company) html += '<p><strong>Company:</strong> ' + data.company + '</p>';
  if (data.city || data.country) {
    const loc = [data.city, data.country].filter(Boolean).join(', ');
    html += '<p><strong>Location:</strong> ' + loc + '</p>';
  }
  // Show Company with Country
  if (data.company && data.country) {
    html += '<p><strong>Company with Country:</strong> ' + data.company + ' - ' + data.country + '</p>';
  }
  document.getElementById('contactInfo').innerHTML = html;
}

function saveContactWithAddedBy() {
  const addedBy = document.getElementById('addedBy').value.trim();
  
  if (!addedBy) {
    // Show error if "Added By" is empty
    const statusElement = document.getElementById('status');
    statusElement.className = 'error';
    statusElement.textContent = 'Error: "Added By" field is required.';
    statusElement.style.display = 'block';
    return;
  }
  
  // Save the "Added By" value to localStorage
  localStorage.setItem('addedByName', addedBy);
  
  // Update the display
  document.getElementById('savedAddedByName').textContent = addedBy;
  document.getElementById('addedByDisplay').style.display = 'flex';
  
  // Hide the "Added By" form
  document.getElementById('addedByContainer').style.display = 'none';
  
  // Proceed with saving the contact
  saveContact(addedBy);
}

function saveContact(addedBy) {
  const statusElement = document.getElementById('status');
  statusElement.className = '';
  statusElement.textContent = 'Saving contact...';
  statusElement.style.display = 'block';
  
  // Hide and clear success messages
  document.getElementById('existsMessage').innerHTML = 'Contact already exists in CRM';
  document.getElementById('existsMessage').style.display = 'none';
  document.getElementById('savedMessage').innerHTML = 'Contact saved successfully!';
  document.getElementById('savedMessage').style.display = 'none';

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.id) {
      statusElement.className = 'error';
      statusElement.textContent = 'Error: Could not access the current tab.';
      return;
    }

    chrome.tabs.sendMessage(currentTab.id, { action: "getProfileData" }, function (profileData) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        statusElement.className = 'error';
        statusElement.textContent = 'Error connecting to the page. Please refresh and try again.';
        return;
      }

      if (profileData) {
        const randomEmail = generateRandomEmail();
        const contactData = {
          "First Name": profileData.firstName || '',
          "Last Name": profileData.lastName || '',
          "Full Name": profileData.fullName || (profileData.firstName + ' ' + profileData.lastName),
          "Job Title": profileData.jobTitle || '',
          "Company": profileData.company + ' ' + '-' + ' ' + profileData.country || '',
          "Company Name": profileData.company || '',
          "Company with Country": profileData.company + ' ' + '-' + ' ' + profileData.country,
          "LinkedIn": profileData.linkedinUrl || currentTab.url,
          "Country": profileData.country || '',
          "Email": randomEmail,
          "City": profileData.city || '',
          "Time Zone": 'Unknown',
          "Company LinkedIn": profileData.linkedinUrl || currentTab.url,
          "Company Website": '',
          "Phone Number": '0000000000',
          "Engagement Status": 'New',
          "Linkedln Connection Status": 'Not Connected',
          "Added By": addedBy // Add the "Added By" field
        };

        chrome.storage.sync.get("accessToken", ({ accessToken }) => {
          fetch('https://apitest.sales-buddy.in/api/contact/postSingleContact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify(contactData)
          })
            .then(response => {
              if (!response.ok) {
                return response.json().then(errorData => {
                  throw new Error(errorData.message || 'Failed to save contact');
                });
              }
              return response.json();
            })
            .then(data => {
              if (data.success) {
                document.getElementById('saveContact').style.display = 'none';
                document.getElementById('existsMessage').style.display = 'none';
                
                // Show saved message with a link to view the contact
                const savedMessageElement = document.getElementById('savedMessage');
                savedMessageElement.innerHTML = 'Contact saved successfully!';
                savedMessageElement.style.display = 'block';
                
                // Add a link to view the contact details
                const viewContactLink = document.createElement('a');
                viewContactLink.href = `https://test.sales-buddy.in/singleContact?fullName=${encodeURIComponent(profileData.fullName || (profileData.firstName + ' ' + profileData.lastName))}`;
                viewContactLink.target = '_blank';
                viewContactLink.className = 'view-contact-btn';
                viewContactLink.textContent = 'View Contact Details';
                savedMessageElement.appendChild(document.createElement('br'));
                savedMessageElement.appendChild(viewContactLink);
                
                statusElement.style.display = 'none';
              } else {
                statusElement.className = 'error';
                statusElement.textContent = data.error || 'Failed to save contact.';
                statusElement.style.display = 'block';
              }
            })
            .catch(error => {
              statusElement.className = 'error';
              statusElement.textContent = 'Error: ' + error.message;
              console.error('API Error:', error);
            });
        });
      } else {
        statusElement.className = 'error';
        statusElement.textContent = 'Error: Could not retrieve profile data.';
      }
    });
  });
}
