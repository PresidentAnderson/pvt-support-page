// Form submission handling for MAC requests and other forms

document.addEventListener('DOMContentLoaded', () => {
  // Handle MAC Request Form submission
  const macRequestForm = document.getElementById('macRequestForm');
  if (macRequestForm) {
    macRequestForm.addEventListener('submit', handleMacRequestSubmit);
  }

  // Handle login form if present
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  // Handle registration form if present
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }
});

// MAC Request form submission
async function handleMacRequestSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = {
    organizationId: formData.get('organization'),
    requestType: formData.get('requestType'),
    priority: formData.get('priority'),
    title: `${formData.get('requestType').toUpperCase()} Request`,
    description: formData.get('requestDescription')
  };

  // Add the email to the description for tracking
  const email = formData.get('requestorEmail');
  if (email) {
    data.description += `\n\nRequester Email: ${email}`;
  }

  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    // Check if user is authenticated
    if (!tokenManager.getToken()) {
      // For unauthenticated users, store the request locally
      // In production, you might want to create a guest ticket endpoint
      const guestRequest = {
        ...data,
        email,
        timestamp: new Date().toISOString(),
        status: 'pending_auth'
      };
      
      // Store in localStorage for later submission
      const pendingRequests = JSON.parse(localStorage.getItem('pendingMacRequests') || '[]');
      pendingRequests.push(guestRequest);
      localStorage.setItem('pendingMacRequests', JSON.stringify(pendingRequests));
      
      showToast('MAC Request saved! Please log in to submit.', 'info');
      e.target.reset();
    } else {
      // Submit authenticated request
      const response = await api.createMacRequest(data);
      
      if (response.success) {
        showToast(`MAC Request submitted successfully! Ticket #${response.data.ticketNumber}`, 'success');
        e.target.reset();
        
        // Optionally redirect to ticket view
        if (response.data.id) {
          setTimeout(() => {
            window.location.href = `/ticket.html?id=${response.data.id}`;
          }, 2000);
        }
      }
    }
  } catch (error) {
    console.error('MAC Request submission error:', error);
    showToast('Failed to submit MAC request. Please try again.', 'error');
  } finally {
    // Restore button state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Submit MAC Request';
    submitBtn.disabled = false;
  }
}

// Login form submission
async function handleLoginSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    const response = await api.login(email, password);
    
    if (response.success) {
      showToast('Login successful!', 'success');
      
      // Check for pending MAC requests
      const pendingRequests = JSON.parse(localStorage.getItem('pendingMacRequests') || '[]');
      if (pendingRequests.length > 0) {
        // Submit pending requests
        for (const request of pendingRequests) {
          try {
            await api.createMacRequest(request);
          } catch (err) {
            console.error('Failed to submit pending request:', err);
          }
        }
        localStorage.removeItem('pendingMacRequests');
        showToast(`${pendingRequests.length} pending request(s) submitted`, 'info');
      }
      
      // Redirect to dashboard or original page
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Invalid email or password', 'error');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Login';
    submitBtn.disabled = false;
  }
}

// Registration form submission
async function handleRegisterSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const userData = {
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    organizationCode: formData.get('organizationCode'),
    phone: formData.get('phone')
  };

  // Validate password confirmation
  if (formData.get('confirmPassword') !== userData.password) {
    showToast('Passwords do not match', 'error');
    return;
  }

  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;

    const response = await api.register(userData);
    
    if (response.success) {
      showToast('Registration successful! Redirecting...', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast(error.message || 'Registration failed', 'error');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Register';
    submitBtn.disabled = false;
  }
}

// Form validation helpers
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

// Add real-time validation
document.addEventListener('input', (e) => {
  if (e.target.type === 'email') {
    const isValid = validateEmail(e.target.value);
    e.target.classList.toggle('invalid', !isValid && e.target.value.length > 0);
  }
  
  if (e.target.type === 'password' && e.target.name === 'password') {
    const isValid = validatePassword(e.target.value);
    e.target.classList.toggle('invalid', !isValid && e.target.value.length > 0);
  }
});

// Add CSS for invalid fields
const style = document.createElement('style');
style.textContent = `
  input.invalid {
    border-color: #ef4444 !important;
  }
  
  input.invalid:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
  }
`;
document.head.appendChild(style);