import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/v1';

// Replace with your actual credentials
const CREDENTIALS = {
  email: 'john@mailinator.com',
  password: 'P@33word123',
};

let authCookie: string = '';
let organizationId: string = '';
let monitorId: string = '';
let statusPageId: string = '';

async function login() {
  console.log('1. Logging in...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, CREDENTIALS, {
      withCredentials: true,
    });

    // Extract cookies from response
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
      headers: {
        Cookie: authCookie,
      },
    });

    if (response.data.data && response.data.data.length > 0) {
      organizationId = response.data.data[0].id;
      console.log('✓ Organization ID:', organizationId, '\n');
      return true;
    }
    console.log('✗ No organizations found\n');
    return false;
  } catch (error) {
    console.error(
      '✗ Failed to get organizations:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function getMonitors() {
  console.log('3. Getting monitors...');
  try {
    const response = await axios.get(
      `${API_BASE}/organizations/${organizationId}/monitors`,
      {
        withCredentials: true,
        headers: {
          Cookie: authCookie,
        },
      },
    );

    if (response.data.data && response.data.data.length > 0) {
      monitorId = response.data.data[0].id;
      console.log('✓ Monitor ID:', monitorId);
      console.log('Monitor isPublic:', response.data.data[0].isPublic, '\n');
      return true;
    }
    console.log('✗ No monitors found\n');
    return false;
  } catch (error: any) {
    console.error(
      '✗ Failed to get monitors:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function createStatusPage() {
  console.log('4. Creating status page...');
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
        headers: {
          Cookie: authCookie,
        },
      },
    );

    statusPageId = response.data.data.id;
    console.log('✓ Created status page:', response.data.data.name);
    console.log('Status Page ID:', statusPageId);
    console.log('Slug:', response.data.data.slug, '\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to create status page:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function getStatusPages() {
  console.log('5. Getting all status pages...');
  try {
    const response = await axios.get(
      `${API_BASE}/organizations/${organizationId}/status-pages`,
      {
        withCredentials: true,
        headers: {
          Cookie: authCookie,
        },
      },
    );

    console.log('✓ Found', response.data.data.length, 'status pages\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to get status pages:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function getStatusPage() {
  console.log('6. Getting specific status page...');
  try {
    const response = await axios.get(
      `${API_BASE}/organizations/${organizationId}/status-pages/${statusPageId}`,
      {
        withCredentials: true,
        headers: {
          Cookie: authCookie,
        },
      },
    );

    console.log('✓ Status page:', response.data.data.name, '\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to get status page:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function updateStatusPage() {
  console.log('7. Updating status page...');
  try {
    const response = await axios.patch(
      `${API_BASE}/organizations/${organizationId}/status-pages/${statusPageId}`,
      {
        name: 'Updated Test Status Page',
        isPublic: false,
      },
      {
        withCredentials: true,
        headers: {
          Cookie: authCookie,
        },
      },
    );

    console.log('✓ Updated status page:', response.data.data.name);
    console.log('isPublic:', response.data.data.isPublic, '\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to update status page:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function makeMonitorPrivate() {
  console.log('8. Making monitor private...');
  try {
    const response = await axios.patch(
      `${API_BASE}/organizations/${organizationId}/monitors/${monitorId}`,
      {
        isPublic: false,
      },
      {
        withCredentials: true,
        headers: {
          Cookie: authCookie,
        },
      },
    );

    console.log('✓ Monitor is now private\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to update monitor:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function makeMonitorPublic() {
  console.log('9. Making monitor public again...');
  try {
    const response = await axios.patch(
      `${API_BASE}/organizations/${organizationId}/monitors/${monitorId}`,
      {
        isPublic: true,
      },
      {
        withCredentials: true,
        headers: {
          Cookie: authCookie,
        },
      },
    );

    console.log('✓ Monitor is now public\n');
    return true;
  } catch (error: any) {
    console.error(
      '✗ Failed to update monitor:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function deleteStatusPage() {
  console.log('10. Deleting status page...');
  try {
    await axios.delete(
      `${API_BASE}/organizations/${organizationId}/status-pages/${statusPageId}`,
      {
        withCredentials: true,
        headers: {
          Cookie: authCookie,
        },
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
  console.log('=== API Testing Script ===\n');

  const steps = [
    login,
    getOrganizations,
    getMonitors,
    createStatusPage,
    getStatusPages,
    getStatusPage,
    updateStatusPage,
    makeMonitorPrivate,
    makeMonitorPublic,
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
}

main();
