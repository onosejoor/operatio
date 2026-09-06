import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/v1';

// Replace with your actual credentials
const CREDENTIALS = {
  email: 'john@mailinator.com',
  password: 'P@33word123',
};

let authCookie: string = '';
let organizationId: string = '';
let publicMonitorId: string = '';
let privateMonitorId: string = '';
let statusPageId: string = '';
let statusPageSlug: string = '';

async function login() {
  console.log('1. Logging in...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, CREDENTIALS, {
      withCredentials: true,
    });

    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      authCookie = setCookieHeader[0];
      console.log('✓ Logged in successfully\n');
      return true;
    }
    console.log('✗ No cookie received\n');
    return false;
  } catch (error: any) {
    console.error('✗ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function getOrganizations() {
  console.log('2. Getting organizations...');
  try {
    const response = await axios.get(`${API_BASE}/organizations`, {
      withCredentials: true,
      headers: { Cookie: authCookie },
    });

    if (response.data.data && response.data.data.length > 0) {
      organizationId = response.data.data[0].id;
      console.log('✓ Organization ID:', organizationId, '\n');
      return true;
    }
    console.log('✗ No organizations found\n');
    return false;
  } catch (error: any) {
    console.error(
      '✗ Failed to get organizations:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function createPublicMonitor() {
  console.log('3. Creating a public monitor (isPublic: true)...');
  try {
    const response = await axios.post(
      `${API_BASE}/organizations/${organizationId}/monitors`,
      {
        name: 'Public API Monitor',
        url: 'https://httpbin.org/status/200',
        interval: 60,
        timeout: 10000,
        isPublic: true,
      },
      {
        withCredentials: true,
        headers: { Cookie: authCookie },
      },
    );

    console.log('Response:', JSON.stringify(response.data, null, 2));
    publicMonitorId = response.data.data.id;
    console.log('✓ Created public monitor:', response.data.data.name);
    console.log('Monitor ID:', publicMonitorId);
    console.log('isPublic:', response.data.data.isPublic, '\n');
    return true;
  } catch (error: any) {
    console.error('✗ Failed to create public monitor:');
    console.error('Error response:', error.response?.data);
    console.error('Error message:', error.message);
    return false;
  }
}

async function createPrivateMonitor() {
  console.log('4. Creating a private monitor (isPublic: false)...');
  try {
    const response = await axios.post(
      `${API_BASE}/organizations/${organizationId}/monitors`,
      {
        name: 'Private API Monitor',
        url: 'https://httpbin.org/status/200',
        interval: 60,
        timeout: 10000,
        isPublic: false,
      },
      {
        withCredentials: true,
        headers: { Cookie: authCookie },
      },
    );

    privateMonitorId = response.data.data.id;
    console.log('✓ Created private monitor:', response.data.data.name);
    console.log('Monitor ID:', privateMonitorId);
    console.log('isPublic:', response.data.data.isPublic, '\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to create private monitor:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function getIncidentsForMonitor() {
  console.log('5. Getting incidents for a monitor...');
  try {
    const response = await axios.get(
      `${API_BASE}/organizations/${organizationId}/monitors/${publicMonitorId}/incidents`,
      {
        withCredentials: true,
        headers: { Cookie: authCookie },
      },
    );

    console.log(
      '✓ Found',
      response.data.data.data.length,
      'incidents for monitor',
    );
    if (response.data.data.data.length > 0) {
      const latestIncident = response.data.data.data[0];
      console.log('Latest incident ID:', latestIncident.id);
      console.log('Started at:', latestIncident.startedAt);
      console.log(
        'Resolved at:',
        latestIncident.resolvedAt || 'Not resolved yet',
        '\n',
      );
    } else {
      console.log('No incidents found (monitor is healthy)\n');
    }
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to get incidents:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function getOrganizationIncidents() {
  console.log('6. Getting all incidents for organization...');
  try {
    const response = await axios.get(
      `${API_BASE}/organizations/${organizationId}/incidents`,
      {
        withCredentials: true,
        headers: { Cookie: authCookie },
      },
    );

    console.log('✓ Found', response.data.data.data.length, 'total incidents\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to get organization incidents:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function createStatusPage() {
  console.log('7. Creating a status page...');
  try {
    const response = await axios.post(
      `${API_BASE}/organizations/${organizationId}/status-pages`,
      {
        name: 'Test Status Page',
        slug: `test-status-${Date.now()}`,
        isPublic: true,
        description: 'Test status page for API testing',
      },
      {
        withCredentials: true,
        headers: { Cookie: authCookie },
      },
    );

    statusPageId = response.data.data.id;
    statusPageSlug = response.data.data.slug;
    console.log('✓ Created status page:', response.data.data.name);
    console.log('Status Page ID:', statusPageId);
    console.log('Slug:', statusPageSlug);
    console.log('isPublic:', response.data.data.isPublic, '\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to create status page:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function updateStatusPageVisibility() {
  console.log('8. Updating status page isPublic to false...');
  try {
    const response = await axios.patch(
      `${API_BASE}/organizations/${organizationId}/status-pages/${statusPageId}`,
      {
        isPublic: false,
      },
      {
        withCredentials: true,
        headers: { Cookie: authCookie },
      },
    );

    console.log(
      '✓ Updated status page isPublic to:',
      response.data.data.isPublic,
      '\n',
    );
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to update status page:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function testSlugUniqueness() {
  console.log('9. Testing slug uniqueness constraint...');
  try {
    // Try to create another status page with the same slug
    const response = await axios.post(
      `${API_BASE}/organizations/${organizationId}/status-pages`,
      {
        name: 'Duplicate Status Page',
        slug: statusPageSlug, // Use the slug from the previously created status page
        isPublic: true,
      },
      {
        withCredentials: true,
        headers: { Cookie: authCookie },
      },
    );

    console.log(
      '✗ Slug uniqueness constraint not enforced (should have failed)\n',
    );
    return false;
  } catch (error: any) {
    if (error.response?.status === 409 || error.response?.status === 400) {
      console.log('✓ Slug uniqueness constraint working correctly\n');
      return true;
    }
    console.error('✗ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

async function deletePrivateMonitor() {
  console.log('10. Deleting private monitor...');
  try {
    await axios.delete(
      `${API_BASE}/organizations/${organizationId}/monitors/${privateMonitorId}`,
      {
        withCredentials: true,
        headers: { Cookie: authCookie },
      },
    );

    console.log('✓ Deleted private monitor\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to delete monitor:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function deleteStatusPage() {
  console.log('11. Deleting status page...');
  try {
    await axios.delete(
      `${API_BASE}/organizations/${organizationId}/status-pages/${statusPageId}`,
      {
        withCredentials: true,
        headers: { Cookie: authCookie },
      },
    );

    console.log('✓ Deleted status page\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to delete status page:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function main() {
  console.log('=== Comprehensive API Testing Script ===\n');

  const steps = [
    login,
    getOrganizations,
    createPublicMonitor,
    createPrivateMonitor,
    getIncidentsForMonitor,
    getOrganizationIncidents,
    createStatusPage,
    updateStatusPageVisibility,
    testSlugUniqueness,
    deletePrivateMonitor,
    deleteStatusPage,
  ];

  for (const step of steps) {
    const success = await step();
    if (!success) {
      console.log('\n✗ Test stopped due to failure');
      break;
    }
  }

  console.log('\n=== Test Complete ===');
  console.log('\nNote: To test incident creation/resolution:');
  console.log(
    '- Manually cause a monitor to fail (change URL to invalid endpoint)',
  );
  console.log('- Wait for scheduler to run (30 seconds)');
  console.log('- Check incidents endpoint to see new incident');
  console.log('- Fix the URL and wait for next check');
  console.log('- Verify incident has resolvedAt timestamp');
}

main();
