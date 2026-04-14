import {
    ConnectionSettings,
    CopilotStudioClient,
    CopilotStudioWebChat
} from 'https://unpkg.com/@microsoft/agents-copilotstudio-client@1.1.0-alpha.58/dist/src/browser.mjs';

const config = window.mcsPortalCopilotConfig || {};
const defaultScope = config.scope || 'https://api.powerplatform.com/.default';
const runtimeConfigStorageKey = 'mcsPortalCopilotRuntimeConfig';

function readSavedRuntimeConfig() {
    try {
        return JSON.parse(window.localStorage.getItem(runtimeConfigStorageKey) || '{}');
    } catch (error) {
        return {};
    }
}

const runtimeConfig = Object.assign({}, config, readSavedRuntimeConfig());

const state = {
    client: null,
    connection: null,
    isConnecting: false,
    msalKey: '',
    msalInstance: null,
    pendingPrompt: '',
    store: null
};

const elements = {
    appClientIdInput: document.getElementById('copilot-app-client-id-input'),
    clearConfigButton: document.getElementById('copilot-clear-config-button'),
    connectButton: document.getElementById('copilot-connect-button'),
    directLineSecretInput: document.getElementById('copilot-direct-line-secret-input'),
    emptyDetail: document.getElementById('copilot-empty-detail'),
    emptyState: document.getElementById('copilot-empty-state'),
    error: document.getElementById('copilot-error'),
    resetButton: document.getElementById('copilot-reset-button'),
    saveConfigButton: document.getElementById('copilot-save-config-button'),
    sessionMeta: document.getElementById('copilot-session-meta'),
    setupDetail: document.getElementById('copilot-setup-detail'),
    setupNote: document.getElementById('copilot-setup-note'),
    setupTitle: document.getElementById('copilot-setup-title'),
    statusDetail: document.getElementById('copilot-status-detail'),
    statusPill: document.getElementById('copilot-status-pill'),
    tenantIdInput: document.getElementById('copilot-tenant-id-input'),
    webchat: document.getElementById('copilot-webchat')
};

function getEffectiveConfig() {
    return Object.assign({}, runtimeConfig, {
        directLineSecret: (elements.directLineSecretInput && elements.directLineSecretInput.value.trim()) || runtimeConfig.directLineSecret || '',
        appClientId: (elements.appClientIdInput && elements.appClientIdInput.value.trim()) || runtimeConfig.appClientId || '',
        tenantId: (elements.tenantIdInput && elements.tenantIdInput.value.trim()) || runtimeConfig.tenantId || ''
    });
}

function isServedOverHttp() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

function getRedirectUri() {
    return isServedOverHttp() ? window.location.origin : 'http://localhost';
}

function getAuthority(activeConfig) {
    return activeConfig.authority || 'https://login.microsoftonline.com/' + activeConfig.tenantId;
}

function hasDirectLineSecret(activeConfig) {
    return Boolean(activeConfig.directLineSecret);
}

function hasBrowserAuthConfig(activeConfig) {
    return Boolean(activeConfig.directConnectUrl && activeConfig.appClientId && activeConfig.tenantId);
}

function buildDirectLineSetupDetail() {
    return 'Paste the Copilot Studio Web channel Direct Line secret below to connect this static portal. The secret is stored only in this browser unless you later add your own backend token service.';
}

function getRequestedScope(activeConfig) {
    return activeConfig.scope || defaultScope;
}

function buildBrowserAuthSetupDetail(activeConfig) {
    const resource = getRequestedScope(activeConfig).replace(/\/\.default$/i, '');
    return 'Use a separate Microsoft Entra SPA/public client app registration for browser sign-in. Do not use the Copilot Studio Agent app ID here. Add ' + getRedirectUri() + ' as a redirect URI, grant delegated permission CopilotStudio.Copilots.Invoke on Power Platform API (' + resource + '), grant consent, then retry with that app\'s client ID.';
}

function hasRequiredConfig() {
    const activeConfig = getEffectiveConfig();
    return hasDirectLineSecret(activeConfig) || hasBrowserAuthConfig(activeConfig);
}

function setStatus(tone, pillText, detailText) {
    if (!elements.statusPill || !elements.statusDetail) return;
    elements.statusPill.className = 'agent-status-pill is-' + tone;
    elements.statusPill.textContent = pillText;
    elements.statusDetail.textContent = detailText;
}

function setSetupNote(title, detail, hidden) {
    if (!elements.setupNote || !elements.setupTitle || !elements.setupDetail) return;
    elements.setupTitle.textContent = title;
    elements.setupDetail.textContent = detail;
    elements.setupNote.hidden = hidden;
}

function setError(message) {
    if (!elements.error) return;
    if (!message) {
        elements.error.hidden = true;
        elements.error.textContent = '';
        return;
    }
    elements.error.hidden = false;
    elements.error.textContent = message;
}

function setEmptyState(title, detail) {
    if (!elements.emptyState || !elements.emptyDetail) return;
    const heading = elements.emptyState.querySelector('h4');
    if (heading) heading.textContent = title;
    elements.emptyDetail.textContent = detail;
    elements.emptyState.hidden = false;
}

function hideEmptyState() {
    if (elements.emptyState) elements.emptyState.hidden = true;
}

function resetRenderedChat() {
    if (!elements.webchat) return;
    elements.webchat.innerHTML = '';
    state.store = null;
    state.connection = null;
    state.client = null;
}

function persistRuntimeConfig() {
    const activeConfig = getEffectiveConfig();
    runtimeConfig.directLineSecret = activeConfig.directLineSecret;
    runtimeConfig.appClientId = activeConfig.appClientId;
    runtimeConfig.tenantId = activeConfig.tenantId;

    window.localStorage.setItem(runtimeConfigStorageKey, JSON.stringify({
        directLineSecret: runtimeConfig.directLineSecret,
        appClientId: runtimeConfig.appClientId,
        tenantId: runtimeConfig.tenantId
    }));
}

function clearPersistedRuntimeConfig() {
    runtimeConfig.directLineSecret = config.directLineSecret || '';
    runtimeConfig.appClientId = config.appClientId || '';
    runtimeConfig.tenantId = config.tenantId || '';
    state.msalInstance = null;
    state.msalKey = '';
    window.localStorage.removeItem(runtimeConfigStorageKey);

    if (elements.directLineSecretInput) elements.directLineSecretInput.value = runtimeConfig.directLineSecret;
    if (elements.appClientIdInput) elements.appClientIdInput.value = runtimeConfig.appClientId;
    if (elements.tenantIdInput) elements.tenantIdInput.value = runtimeConfig.tenantId;
}

function syncConfigInputs() {
    if (elements.directLineSecretInput) elements.directLineSecretInput.value = runtimeConfig.directLineSecret || '';
    if (elements.appClientIdInput) elements.appClientIdInput.value = runtimeConfig.appClientId || '';
    if (elements.tenantIdInput) elements.tenantIdInput.value = runtimeConfig.tenantId || '';
}

function buildStyleOptions() {
    return Object.assign({
        accent: '#6B3FA0',
        backgroundColor: 'rgba(255,255,255,0)',
        hideUploadButton: true,
        bubbleBackground: '#F3EDF8',
        bubbleBorderColor: 'rgba(107,63,160,.12)',
        bubbleTextColor: '#1F1634',
        bubbleFromUserBackground: '#6B3FA0',
        bubbleFromUserBorderColor: '#6B3FA0',
        bubbleFromUserTextColor: '#FFFFFF',
        sendBoxBackground: '#FFFFFF',
        sendBoxBorderTop: '1px solid rgba(139,111,192,.12)',
        sendBoxButtonColor: '#6B3FA0',
        sendBoxButtonColorOnDisabled: '#CABFDC',
        sendBoxPlaceholderColor: '#7F7494',
        sendBoxTextColor: '#1F1634',
        botAvatarBackgroundColor: '#8B6FC0',
        userAvatarBackgroundColor: '#F0919B',
        botAvatarInitials: 'MCS',
        userAvatarInitials: 'You',
        suggestedActionBackgroundColor: '#FFFFFF',
        suggestedActionBorderColor: 'rgba(107,63,160,.22)',
        suggestedActionTextColor: '#6B3FA0'
    }, runtimeConfig.styleOptions || {});
}

function isIntegratedAuthUnsupportedMessage(message) {
    return /IntegratedAuthenticationNotSupportedInChannel/i.test(message || '');
}

function updateButtons() {
    if (!elements.connectButton || !elements.resetButton) return;
    const blocked = !isServedOverHttp() || !hasRequiredConfig();
    elements.connectButton.disabled = state.isConnecting || blocked;
    elements.connectButton.textContent = state.isConnecting ? 'Connecting...' : (state.connection ? 'Reconnect agent' : 'Connect agent');
    elements.resetButton.disabled = state.isConnecting || blocked;
}

function evaluateReadiness() {
    const activeConfig = getEffectiveConfig();

    if (!isServedOverHttp()) {
        return {
            ok: false,
            title: 'Serve the portal from http://localhost or your hosted site',
            detail: 'MSAL sign-in needs a real http(s) redirect URI. Opening index.html directly with file:// will not work for the embedded agent.'
        };
    }

    if (!window.WebChat) {
        return {
            ok: false,
            title: 'Web Chat failed to load',
            detail: 'The browser could not load Bot Framework Web Chat from unpkg. Check network access, then refresh the page.'
        };
    }

    if (hasDirectLineSecret(activeConfig)) {
        return {
            ok: true,
            title: 'Ready to connect',
            detail: 'The embedded agent can connect with the saved Direct Line secret and open chat inside this portal.'
        };
    }

    if (!window.msal) {
        return {
            ok: false,
            title: 'Agent auth libraries failed to load',
            detail: 'The browser could not load MSAL from unpkg. Check network access, then refresh the page.'
        };
    }

    if (!activeConfig.directConnectUrl) {
        return {
            ok: false,
            title: 'Add the Copilot Studio Direct Connect URL',
            detail: 'Set directConnectUrl in scripts/copilot-studio-agent-config.js before connecting the embedded agent.'
        };
    }

    if (!hasBrowserAuthConfig(activeConfig)) {
        return {
            ok: false,
            title: 'Complete the connection setup',
            detail: buildBrowserAuthSetupDetail(activeConfig)
        };
    }

    return {
        ok: true,
        title: 'Ready to connect',
        detail: 'The embedded agent can sign in with your configured browser app registration and open the Copilot Studio conversation inside this portal.'
    };
}

async function getMsalInstance(activeConfig) {
    const authKey = [activeConfig.appClientId, activeConfig.tenantId, activeConfig.authority || ''].join('|');

    if (state.msalInstance && state.msalKey === authKey) return state.msalInstance;

    state.msalKey = authKey;
    state.msalInstance = new window.msal.PublicClientApplication({
        auth: {
            clientId: activeConfig.appClientId,
            authority: getAuthority(activeConfig)
        }
    });

    await state.msalInstance.initialize();
    return state.msalInstance;
}

async function acquireToken(activeConfig) {
    const msalInstance = await getMsalInstance(activeConfig);
    const loginRequest = {
        scopes: [getRequestedScope(activeConfig)],
        redirectUri: getRedirectUri()
    };

    try {
        const accounts = await msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            const silentResponse = await msalInstance.acquireTokenSilent(Object.assign({}, loginRequest, {
                account: accounts[0]
            }));
            return silentResponse.accessToken;
        }
    } catch (error) {
        if (!(error instanceof window.msal.InteractionRequiredAuthError)) {
            throw error;
        }
    }

    const interactiveResponse = await msalInstance.loginPopup(loginRequest);
    return interactiveResponse.accessToken;
}

async function createAgentConnection(activeConfig) {
    if (hasDirectLineSecret(activeConfig)) {
        const response = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + activeConfig.directLineSecret,
                'Content-Type': 'application/json'
            },
            body: '{}'
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (error) {
            payload = null;
        }

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('The supplied Direct Line secret was rejected. Regenerate the Copilot Studio Web channel secret and save it again.');
            }

            const responseMessage = payload && payload.error && payload.error.message
                ? payload.error.message
                : (payload && payload.message ? payload.message : 'Unable to generate a Direct Line token from the supplied secret.');

            throw new Error(responseMessage);
        }

        if (!payload || !payload.token) {
            throw new Error('Direct Line token generation succeeded but no token was returned.');
        }

        return {
            connection: window.WebChat.createDirectLine({ token: payload.token }),
            mode: 'directline'
        };
    }

    const token = await acquireToken(activeConfig);
    const settings = new ConnectionSettings({
        appClientId: activeConfig.appClientId,
        tenantId: activeConfig.tenantId,
        authority: activeConfig.authority || undefined,
        environmentId: activeConfig.environmentId || undefined,
        agentIdentifier: activeConfig.agentIdentifier || undefined,
        directConnectUrl: activeConfig.directConnectUrl,
        useExperimentalEndpoint: Boolean(activeConfig.useExperimentalEndpoint)
    });

    if (activeConfig.debug) {
        window.localStorage.debug = 'copilot-studio-client';
    }

    state.client = new CopilotStudioClient(settings, token);

    return {
        connection: CopilotStudioWebChat.createConnection(state.client, { typingIndicator: true }),
        mode: 'authenticated'
    };
}

function renderChat(connection) {
    if (!elements.webchat || !window.WebChat) return;

    resetRenderedChat();
    hideEmptyState();

    state.store = window.WebChat.createStore({}, function () {
        return function (next) {
            return function (action) {
                if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY') {
                    const activity = action.payload && action.payload.activity;

                    if (activity && activity.type === 'trace') {
                        return;
                    }

                    if (activity && typeof activity.text === 'string' && isIntegratedAuthUnsupportedMessage(activity.text)) {
                        const detail = 'This agent requires integrated authentication that the Direct Line web channel cannot provide. Use the browser app sign-in flow instead of the Direct Line secret for this agent.';
                        setError(detail);
                        setStatus('warning', 'Direct Line unsupported', detail);
                        setSetupNote('Use authenticated Direct Connect', buildBrowserAuthSetupDetail(getEffectiveConfig()), false);
                        elements.sessionMeta.textContent = 'Direct Line unsupported for this agent';
                    }
                }

                return next(action);
            };
        };
    });

    window.WebChat.renderWebChat({
        directLine: connection,
        store: state.store,
        locale: 'en-US',
        styleOptions: buildStyleOptions()
    }, elements.webchat);
}

function sendPrompt(promptText) {
    if (!promptText) return;

    if (!state.store) {
        state.pendingPrompt = promptText;
        connectAgent();
        return;
    }

    state.store.dispatch({
        type: 'WEB_CHAT/SEND_MESSAGE',
        payload: { text: promptText }
    });

    setStatus('success', 'Connected', 'Prompt sent to the embedded agent.');
}

function getRawErrorMessage(error) {
    if (!error) return 'Unknown error while initializing the embedded Copilot Studio agent.';
    if (typeof error === 'string') return error;
    if (error.errorMessage) return error.errorMessage;
    if (error.message) return error.message;
    return 'Unknown error while initializing the embedded Copilot Studio agent.';
}

function isInvalidBrowserAppError(message) {
    return /AADSTS650057/i.test(message) || /Invalid resource/i.test(message);
}

function getErrorMessage(error, activeConfig) {
    const rawMessage = getRawErrorMessage(error);

    if (isInvalidBrowserAppError(rawMessage)) {
        return 'AADSTS650057: the configured App Client ID cannot request a Power Platform token. Use a separate Microsoft Entra SPA/public client app registration, not the Copilot Studio Agent app ID. Add ' + getRedirectUri() + ' as a redirect URI, grant CopilotStudio.Copilots.Invoke on Power Platform API, grant consent, then retry with that app\'s client ID.';
    }

    if (/popup_window_error|popup_window/i.test(rawMessage)) {
        return 'The Microsoft sign-in popup was blocked. Allow popups for this portal origin and try connecting again.';
    }

    if (/user_cancelled|cancelled/i.test(rawMessage)) {
        return 'Microsoft sign-in was canceled before the token exchange finished. Reopen Connect agent and complete the popup flow.';
    }

    return rawMessage;
}

function refreshSetupState() {
    const readiness = evaluateReadiness();
    const activeConfig = getEffectiveConfig();

    setSetupNote(readiness.title, readiness.detail, readiness.ok);

    if (!state.connection && !state.isConnecting) {
        if (readiness.ok) {
            setStatus('neutral', 'Ready to connect', hasDirectLineSecret(activeConfig)
                ? 'Use Connect agent to open the Copilot Studio chat with the saved Direct Line secret.'
                : 'Use Connect agent to sign in and open the Copilot Studio chat without leaving the portal. Redirect URI: ' + getRedirectUri());
        } else {
            setStatus('warning', 'Setup required', readiness.detail);
        }
    }

    updateButtons();
}

async function connectAgent() {
    const readiness = evaluateReadiness();
    const activeConfig = getEffectiveConfig();
    const usesDirectLineSecret = hasDirectLineSecret(activeConfig);

    if (!readiness.ok) {
        setStatus('warning', 'Setup required', readiness.detail);
        setSetupNote(readiness.title, readiness.detail, false);
        setEmptyState('Complete the setup first', readiness.detail);
        updateButtons();
        return;
    }

    state.isConnecting = true;
    setError('');
    setSetupNote(readiness.title, readiness.detail, true);
    setStatus('neutral', 'Connecting...', usesDirectLineSecret
        ? 'The portal is exchanging the saved Direct Line secret for a Web Chat token and opening the agent inline.'
        : 'Microsoft sign-in may open in a popup window. The portal will render chat after token acquisition succeeds.');
    elements.sessionMeta.textContent = usesDirectLineSecret ? 'Connecting with Direct Line' : 'Connecting';
    updateButtons();

    try {
        const connectionResult = await createAgentConnection(activeConfig);
        state.connection = connectionResult.connection;

        renderChat(state.connection);
        setStatus('success', 'Connected', connectionResult.mode === 'directline'
            ? 'The Copilot Studio agent is live inside this portal tab via the Direct Line web channel.'
            : 'The Copilot Studio agent is live inside this portal tab.');
        elements.sessionMeta.textContent = (activeConfig.agentDisplayName || 'Copilot Studio agent') + (connectionResult.mode === 'directline'
            ? ' connected via Direct Line'
            : ' connected');

        if (state.pendingPrompt) {
            const promptToSend = state.pendingPrompt;
            state.pendingPrompt = '';
            window.setTimeout(function () {
                sendPrompt(promptToSend);
            }, 150);
        }
    } catch (error) {
        const rawMessage = getRawErrorMessage(error);
        const message = getErrorMessage(error, activeConfig);
        resetRenderedChat();
        setError(message);

        if (isInvalidBrowserAppError(rawMessage)) {
            const setupDetail = buildBrowserAuthSetupDetail(activeConfig);
            setSetupNote('Use a separate browser app registration', setupDetail, false);
            setEmptyState('Browser app setup required', setupDetail);
            setStatus('warning', 'Browser app setup required', setupDetail);
        } else {
            setEmptyState('Connection failed', message);
            setStatus('error', 'Connection failed', 'Check popup permissions, redirect URI configuration, and app permissions, then try again.');
        }

        elements.sessionMeta.textContent = 'Connection failed';
    } finally {
        state.isConnecting = false;
        updateButtons();
    }
}

async function restartAgent() {
    state.pendingPrompt = '';
    resetRenderedChat();
    setEmptyState('Starting a fresh chat session', 'The portal is reconnecting the Copilot Studio agent in this tab.');
    await connectAgent();
}

function bindPromptButtons() {
    document.querySelectorAll('[data-agent-prompt]').forEach(function (button) {
        button.addEventListener('click', function () {
            sendPrompt(button.getAttribute('data-agent-prompt') || '');
        });
    });
}

function initializeAgentUi() {
    if (!elements.connectButton || !elements.resetButton || !elements.sessionMeta) return;

    syncConfigInputs();
    refreshSetupState();
    setEmptyState('Connect the agent to start a live chat', 'Use a Direct Line secret or a dedicated Microsoft Entra browser app registration, then the portal will render the Copilot Studio conversation inline.');
    elements.sessionMeta.textContent = 'Not connected';

    elements.connectButton.addEventListener('click', function () {
        connectAgent();
    });

    elements.resetButton.addEventListener('click', function () {
        restartAgent();
    });

    if (elements.saveConfigButton) {
        elements.saveConfigButton.addEventListener('click', function () {
            persistRuntimeConfig();
            refreshSetupState();
            setError('');
            setEmptyState('Connect the agent to start a live chat', getEffectiveConfig().directLineSecret
                ? 'Direct Line secret was saved locally for this browser. Connect agent to start the embedded chat.'
                : 'Browser auth values were saved locally for this machine. App Client ID must come from your Entra SPA/public client registration, not the Copilot Studio Agent app.');
        });
    }

    if (elements.clearConfigButton) {
        elements.clearConfigButton.addEventListener('click', function () {
            clearPersistedRuntimeConfig();
            refreshSetupState();
            setError('');
            setEmptyState('Connect the agent to start a live chat', 'Saved Direct Line secret and browser auth values were cleared from this machine. Enter fresh values or update the config file.');
        });
    }

    [elements.directLineSecretInput, elements.appClientIdInput, elements.tenantIdInput].forEach(function (input) {
        if (!input) return;
        input.addEventListener('input', function () {
            state.msalInstance = null;
            state.msalKey = '';
            refreshSetupState();
        });
    });

    bindPromptButtons();
    updateButtons();
}

initializeAgentUi();import {
    ConnectionSettings,
    CopilotStudioClient,
    CopilotStudioWebChat
} from 'https://unpkg.com/@microsoft/agents-copilotstudio-client@1.1.0-alpha.58/dist/src/browser.mjs';

const config = window.mcsPortalCopilotConfig || {};
const defaultScope = config.scope || 'https://api.powerplatform.com/.default';
const runtimeConfigStorageKey = 'mcsPortalCopilotRuntimeConfig';

function readSavedRuntimeConfig() {
    try {
        return JSON.parse(window.localStorage.getItem(runtimeConfigStorageKey) || '{}');
    } catch (error) {
        return {};
    }
}

const runtimeConfig = Object.assign({}, config, readSavedRuntimeConfig());

const state = {
    client: null,
    connection: null,
    isConnecting: false,
    msalKey: '',
    msalInstance: null,
    pendingPrompt: '',
    store: null
};

const elements = {
    appClientIdInput: document.getElementById('copilot-app-client-id-input'),
    clearConfigButton: document.getElementById('copilot-clear-config-button'),
    connectButton: document.getElementById('copilot-connect-button'),
    directLineSecretInput: document.getElementById('copilot-direct-line-secret-input'),
    emptyDetail: document.getElementById('copilot-empty-detail'),
    emptyState: document.getElementById('copilot-empty-state'),
    error: document.getElementById('copilot-error'),
    resetButton: document.getElementById('copilot-reset-button'),
    saveConfigButton: document.getElementById('copilot-save-config-button'),
    sessionMeta: document.getElementById('copilot-session-meta'),
    setupDetail: document.getElementById('copilot-setup-detail'),
    setupNote: document.getElementById('copilot-setup-note'),
    setupTitle: document.getElementById('copilot-setup-title'),
    statusDetail: document.getElementById('copilot-status-detail'),
    statusPill: document.getElementById('copilot-status-pill'),
    tenantIdInput: document.getElementById('copilot-tenant-id-input'),
    webchat: document.getElementById('copilot-webchat')
};

function getEffectiveConfig() {
    return Object.assign({}, runtimeConfig, {
        directLineSecret: (elements.directLineSecretInput && elements.directLineSecretInput.value.trim()) || runtimeConfig.directLineSecret || '',
        appClientId: (elements.appClientIdInput && elements.appClientIdInput.value.trim()) || runtimeConfig.appClientId || '',
        tenantId: (elements.tenantIdInput && elements.tenantIdInput.value.trim()) || runtimeConfig.tenantId || ''
    });
}

function isServedOverHttp() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

function getRedirectUri() {
    return isServedOverHttp() ? window.location.origin : 'http://localhost';
}

function getAuthority(activeConfig) {
    return activeConfig.authority || 'https://login.microsoftonline.com/' + activeConfig.tenantId;
}

function hasDirectLineSecret(activeConfig) {
    return Boolean(activeConfig.directLineSecret);
}

function hasBrowserAuthConfig(activeConfig) {
    return Boolean(activeConfig.directConnectUrl && activeConfig.appClientId && activeConfig.tenantId);
}

function buildDirectLineSetupDetail() {
    return 'Paste the Copilot Studio Web channel Direct Line secret below to connect this static portal. The secret is stored only in this browser unless you later add your own backend token service.';
}

function getRequestedScope(activeConfig) {
    return activeConfig.scope || defaultScope;
}

function buildBrowserAuthSetupDetail(activeConfig) {
    const resource = getRequestedScope(activeConfig).replace(/\/\.default$/i, '');
    return 'Use a separate Microsoft Entra SPA/public client app registration for browser sign-in. Do not use the Copilot Studio Agent app ID here. Add ' + getRedirectUri() + ' as a redirect URI, grant delegated permission CopilotStudio.Copilots.Invoke on Power Platform API (' + resource + '), grant consent, then retry with that app\'s client ID.';
}

function hasRequiredConfig() {
    const activeConfig = getEffectiveConfig();
    return hasDirectLineSecret(activeConfig) || hasBrowserAuthConfig(activeConfig);
}

function setStatus(tone, pillText, detailText) {
    if (!elements.statusPill || !elements.statusDetail) return;
    elements.statusPill.className = 'agent-status-pill is-' + tone;
    elements.statusPill.textContent = pillText;
    elements.statusDetail.textContent = detailText;
}

function setSetupNote(title, detail, hidden) {
    if (!elements.setupNote || !elements.setupTitle || !elements.setupDetail) return;
    elements.setupTitle.textContent = title;
    elements.setupDetail.textContent = detail;
    elements.setupNote.hidden = hidden;
}

function setError(message) {
    if (!elements.error) return;
    if (!message) {
        elements.error.hidden = true;
        elements.error.textContent = '';
        return;
    }
    elements.error.hidden = false;
    elements.error.textContent = message;
}

function setEmptyState(title, detail) {
    if (!elements.emptyState || !elements.emptyDetail) return;
    const heading = elements.emptyState.querySelector('h4');
    if (heading) heading.textContent = title;
    elements.emptyDetail.textContent = detail;
    elements.emptyState.hidden = false;
}

function hideEmptyState() {
    if (elements.emptyState) elements.emptyState.hidden = true;
}

function resetRenderedChat() {
    if (!elements.webchat) return;
    elements.webchat.innerHTML = '';
    state.store = null;
    state.connection = null;
    state.client = null;
}

function persistRuntimeConfig() {
    const activeConfig = getEffectiveConfig();
    runtimeConfig.directLineSecret = activeConfig.directLineSecret;
    runtimeConfig.appClientId = activeConfig.appClientId;
    runtimeConfig.tenantId = activeConfig.tenantId;

    window.localStorage.setItem(runtimeConfigStorageKey, JSON.stringify({
        directLineSecret: runtimeConfig.directLineSecret,
        appClientId: runtimeConfig.appClientId,
        tenantId: runtimeConfig.tenantId
    }));
}

function clearPersistedRuntimeConfig() {
    runtimeConfig.directLineSecret = config.directLineSecret || '';
    runtimeConfig.appClientId = config.appClientId || '';
    runtimeConfig.tenantId = config.tenantId || '';
    state.msalInstance = null;
    state.msalKey = '';
    window.localStorage.removeItem(runtimeConfigStorageKey);

    if (elements.directLineSecretInput) elements.directLineSecretInput.value = runtimeConfig.directLineSecret;
    if (elements.appClientIdInput) elements.appClientIdInput.value = runtimeConfig.appClientId;
    if (elements.tenantIdInput) elements.tenantIdInput.value = runtimeConfig.tenantId;
}

function syncConfigInputs() {
    if (elements.directLineSecretInput) elements.directLineSecretInput.value = runtimeConfig.directLineSecret || '';
    if (elements.appClientIdInput) elements.appClientIdInput.value = runtimeConfig.appClientId || '';
    if (elements.tenantIdInput) elements.tenantIdInput.value = runtimeConfig.tenantId || '';
}

function buildStyleOptions() {
    return Object.assign({
        accent: '#6B3FA0',
        backgroundColor: 'rgba(255,255,255,0)',
        hideUploadButton: true,
        bubbleBackground: '#F3EDF8',
        bubbleBorderColor: 'rgba(107,63,160,.12)',
        bubbleTextColor: '#1F1634',
        bubbleFromUserBackground: '#6B3FA0',
        bubbleFromUserBorderColor: '#6B3FA0',
        bubbleFromUserTextColor: '#FFFFFF',
        sendBoxBackground: '#FFFFFF',
        sendBoxBorderTop: '1px solid rgba(139,111,192,.12)',
        sendBoxButtonColor: '#6B3FA0',
        sendBoxButtonColorOnDisabled: '#CABFDC',
        sendBoxPlaceholderColor: '#7F7494',
        sendBoxTextColor: '#1F1634',
        botAvatarBackgroundColor: '#8B6FC0',
        userAvatarBackgroundColor: '#F0919B',
        botAvatarInitials: 'MCS',
        userAvatarInitials: 'You',
        suggestedActionBackgroundColor: '#FFFFFF',
        suggestedActionBorderColor: 'rgba(107,63,160,.22)',
        suggestedActionTextColor: '#6B3FA0'
    }, runtimeConfig.styleOptions || {});
}

function isIntegratedAuthUnsupportedMessage(message) {
    return /IntegratedAuthenticationNotSupportedInChannel/i.test(message || '');
}

function updateButtons() {
    if (!elements.connectButton || !elements.resetButton) return;
    const blocked = !isServedOverHttp() || !hasRequiredConfig();
    elements.connectButton.disabled = state.isConnecting || blocked;
    elements.connectButton.textContent = state.isConnecting ? 'Connecting...' : (state.connection ? 'Reconnect agent' : 'Connect agent');
    elements.resetButton.disabled = state.isConnecting || blocked;
}

function evaluateReadiness() {
    const activeConfig = getEffectiveConfig();

    if (!isServedOverHttp()) {
        return {
            ok: false,
            title: 'Serve the portal from http://localhost or your hosted site',
            detail: 'MSAL sign-in needs a real http(s) redirect URI. Opening index.html directly with file:// will not work for the embedded agent.'
        };
    }

    if (!window.WebChat) {
        return {
            ok: false,
            title: 'Web Chat failed to load',
            detail: 'The browser could not load Bot Framework Web Chat from unpkg. Check network access, then refresh the page.'
        };
    }

    if (hasDirectLineSecret(activeConfig)) {
        return {
            ok: true,
            title: 'Ready to connect',
            detail: 'The embedded agent can connect with the saved Direct Line secret and open chat inside this portal.'
        };
    }

    if (!window.msal) {
        return {
            ok: false,
            title: 'Agent auth libraries failed to load',
            detail: 'The browser could not load MSAL from unpkg. Check network access, then refresh the page.'
        };
    }

    if (!activeConfig.directConnectUrl) {
        return {
            ok: false,
            title: 'Add the Copilot Studio Direct Connect URL',
            detail: 'Set directConnectUrl in scripts/copilot-studio-agent-config.js before connecting the embedded agent.'
        };
    }

    if (!hasBrowserAuthConfig(activeConfig)) {
        return {
            ok: false,
            title: 'Complete the connection setup',
            detail: buildBrowserAuthSetupDetail(activeConfig)
        };
    }

    return {
        ok: true,
        title: 'Ready to connect',
        detail: 'The embedded agent can sign in with your configured browser app registration and open the Copilot Studio conversation inside this portal.'
    };
}

async function getMsalInstance(activeConfig) {
    const authKey = [activeConfig.appClientId, activeConfig.tenantId, activeConfig.authority || ''].join('|');

    if (state.msalInstance && state.msalKey === authKey) return state.msalInstance;

    state.msalKey = authKey;
    state.msalInstance = new window.msal.PublicClientApplication({
        auth: {
            clientId: activeConfig.appClientId,
            authority: getAuthority(activeConfig)
        }
    });

    await state.msalInstance.initialize();
    return state.msalInstance;
}

async function acquireToken(activeConfig) {
    const msalInstance = await getMsalInstance(activeConfig);
    const loginRequest = {
        scopes: [getRequestedScope(activeConfig)],
        redirectUri: getRedirectUri()
    };

    try {
        const accounts = await msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            const silentResponse = await msalInstance.acquireTokenSilent(Object.assign({}, loginRequest, {
                account: accounts[0]
            }));
            return silentResponse.accessToken;
        }
    } catch (error) {
        if (!(error instanceof window.msal.InteractionRequiredAuthError)) {
            throw error;
        }
    }

    const interactiveResponse = await msalInstance.loginPopup(loginRequest);
    return interactiveResponse.accessToken;
}

async function createAgentConnection(activeConfig) {
    if (hasDirectLineSecret(activeConfig)) {
        const response = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + activeConfig.directLineSecret,
                'Content-Type': 'application/json'
            },
            body: '{}'
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (error) {
            payload = null;
        }

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('The supplied Direct Line secret was rejected. Regenerate the Copilot Studio Web channel secret and save it again.');
            }

            const responseMessage = payload && payload.error && payload.error.message
                ? payload.error.message
                : (payload && payload.message ? payload.message : 'Unable to generate a Direct Line token from the supplied secret.');

            throw new Error(responseMessage);
        }

        if (!payload || !payload.token) {
            throw new Error('Direct Line token generation succeeded but no token was returned.');
        }

        return {
            connection: window.WebChat.createDirectLine({ token: payload.token }),
            mode: 'directline'
        };
    }

    const token = await acquireToken(activeConfig);
    const settings = new ConnectionSettings({
        appClientId: activeConfig.appClientId,
        tenantId: activeConfig.tenantId,
        authority: activeConfig.authority || undefined,
        environmentId: activeConfig.environmentId || undefined,
        agentIdentifier: activeConfig.agentIdentifier || undefined,
        directConnectUrl: activeConfig.directConnectUrl,
        useExperimentalEndpoint: Boolean(activeConfig.useExperimentalEndpoint)
    });

    if (activeConfig.debug) {
        window.localStorage.debug = 'copilot-studio-client';
    }

    state.client = new CopilotStudioClient(settings, token);

    return {
        connection: CopilotStudioWebChat.createConnection(state.client, { typingIndicator: true }),
        mode: 'authenticated'
    };
}

function renderChat(connection) {
    if (!elements.webchat || !window.WebChat) return;

    resetRenderedChat();
    hideEmptyState();

    state.store = window.WebChat.createStore({}, function () {
        return function (next) {
            return function (action) {
                if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY') {
                    const activity = action.payload && action.payload.activity;

                    if (activity && activity.type === 'trace') {
                        return;
                    }

                    if (activity && typeof activity.text === 'string' && isIntegratedAuthUnsupportedMessage(activity.text)) {
                        const detail = 'This agent requires integrated authentication that the Direct Line web channel cannot provide. Use the browser app sign-in flow instead of the Direct Line secret for this agent.';
                        setError(detail);
                        setStatus('warning', 'Direct Line unsupported', detail);
                        setSetupNote('Use authenticated Direct Connect', buildBrowserAuthSetupDetail(getEffectiveConfig()), false);
                        elements.sessionMeta.textContent = 'Direct Line unsupported for this agent';
                    }
                }

                return next(action);
            };
        };
    });

    window.WebChat.renderWebChat({
        directLine: connection,
        store: state.store,
        locale: 'en-US',
        styleOptions: buildStyleOptions()
    }, elements.webchat);
}

function sendPrompt(promptText) {
    if (!promptText) return;

    if (!state.store) {
        state.pendingPrompt = promptText;
        connectAgent();
        return;
    }

    state.store.dispatch({
        type: 'WEB_CHAT/SEND_MESSAGE',
        payload: { text: promptText }
    });

    setStatus('success', 'Connected', 'Prompt sent to the embedded agent.');
}

function getRawErrorMessage(error) {
    if (!error) return 'Unknown error while initializing the embedded Copilot Studio agent.';
    if (typeof error === 'string') return error;
    if (error.errorMessage) return error.errorMessage;
    if (error.message) return error.message;
    return 'Unknown error while initializing the embedded Copilot Studio agent.';
}

function isInvalidBrowserAppError(message) {
    return /AADSTS650057/i.test(message) || /Invalid resource/i.test(message);
}

function getErrorMessage(error, activeConfig) {
    const rawMessage = getRawErrorMessage(error);

    if (isInvalidBrowserAppError(rawMessage)) {
        return 'AADSTS650057: the configured App Client ID cannot request a Power Platform token. Use a separate Microsoft Entra SPA/public client app registration, not the Copilot Studio Agent app ID. Add ' + getRedirectUri() + ' as a redirect URI, grant CopilotStudio.Copilots.Invoke on Power Platform API, grant consent, then retry with that app\'s client ID.';
    }

    if (/popup_window_error|popup_window/i.test(rawMessage)) {
        return 'The Microsoft sign-in popup was blocked. Allow popups for this portal origin and try connecting again.';
    }

    if (/user_cancelled|cancelled/i.test(rawMessage)) {
        return 'Microsoft sign-in was canceled before the token exchange finished. Reopen Connect agent and complete the popup flow.';
    }

    return rawMessage;
}

function refreshSetupState() {
    const readiness = evaluateReadiness();
    const activeConfig = getEffectiveConfig();

    setSetupNote(readiness.title, readiness.detail, readiness.ok);

    if (!state.connection && !state.isConnecting) {
        if (readiness.ok) {
            setStatus('neutral', 'Ready to connect', hasDirectLineSecret(activeConfig)
                ? 'Use Connect agent to open the Copilot Studio chat with the saved Direct Line secret.'
                : 'Use Connect agent to sign in and open the Copilot Studio chat without leaving the portal. Redirect URI: ' + getRedirectUri());
        } else {
            setStatus('warning', 'Setup required', readiness.detail);
        }
    }

    updateButtons();
}

async function connectAgent() {
    const readiness = evaluateReadiness();
    const activeConfig = getEffectiveConfig();
    const usesDirectLineSecret = hasDirectLineSecret(activeConfig);

    if (!readiness.ok) {
        setStatus('warning', 'Setup required', readiness.detail);
        setSetupNote(readiness.title, readiness.detail, false);
        setEmptyState('Complete the setup first', readiness.detail);
        updateButtons();
        return;
    }

    state.isConnecting = true;
    setError('');
    setSetupNote(readiness.title, readiness.detail, true);
    setStatus('neutral', 'Connecting...', usesDirectLineSecret
        ? 'The portal is exchanging the saved Direct Line secret for a Web Chat token and opening the agent inline.'
        : 'Microsoft sign-in may open in a popup window. The portal will render chat after token acquisition succeeds.');
    elements.sessionMeta.textContent = usesDirectLineSecret ? 'Connecting with Direct Line' : 'Connecting';
    updateButtons();

    try {
        const connectionResult = await createAgentConnection(activeConfig);
        state.connection = connectionResult.connection;

        renderChat(state.connection);
        setStatus('success', 'Connected', connectionResult.mode === 'directline'
            ? 'The Copilot Studio agent is live inside this portal tab via the Direct Line web channel.'
            : 'The Copilot Studio agent is live inside this portal tab.');
        elements.sessionMeta.textContent = (activeConfig.agentDisplayName || 'Copilot Studio agent') + (connectionResult.mode === 'directline'
            ? ' connected via Direct Line'
            : ' connected');

        if (state.pendingPrompt) {
            const promptToSend = state.pendingPrompt;
            state.pendingPrompt = '';
            window.setTimeout(function () {
                sendPrompt(promptToSend);
            }, 150);
        }
    } catch (error) {
        const rawMessage = getRawErrorMessage(error);
        const message = getErrorMessage(error, activeConfig);
        resetRenderedChat();
        setError(message);

        if (isInvalidBrowserAppError(rawMessage)) {
            const setupDetail = buildBrowserAuthSetupDetail(activeConfig);
            setSetupNote('Use a separate browser app registration', setupDetail, false);
            setEmptyState('Browser app setup required', setupDetail);
            setStatus('warning', 'Browser app setup required', setupDetail);
        } else {
            setEmptyState('Connection failed', message);
            setStatus('error', 'Connection failed', 'Check popup permissions, redirect URI configuration, and app permissions, then try again.');
        }

        elements.sessionMeta.textContent = 'Connection failed';
    } finally {
        state.isConnecting = false;
        updateButtons();
    }
}

async function restartAgent() {
    state.pendingPrompt = '';
    resetRenderedChat();
    setEmptyState('Starting a fresh chat session', 'The portal is reconnecting the Copilot Studio agent in this tab.');
    await connectAgent();
}

function bindPromptButtons() {
    document.querySelectorAll('[data-agent-prompt]').forEach(function (button) {
        button.addEventListener('click', function () {
            sendPrompt(button.getAttribute('data-agent-prompt') || '');
        });
    });
}

function initializeAgentUi() {
    if (!elements.connectButton || !elements.resetButton || !elements.sessionMeta) return;

    syncConfigInputs();
    refreshSetupState();
    setEmptyState('Connect the agent to start a live chat', 'Use a Direct Line secret or a dedicated Microsoft Entra browser app registration, then the portal will render the Copilot Studio conversation inline.');
    elements.sessionMeta.textContent = 'Not connected';

    elements.connectButton.addEventListener('click', function () {
        connectAgent();
    });

    elements.resetButton.addEventListener('click', function () {
        restartAgent();
    });

    if (elements.saveConfigButton) {
        elements.saveConfigButton.addEventListener('click', function () {
            persistRuntimeConfig();
            refreshSetupState();
            setError('');
            setEmptyState('Connect the agent to start a live chat', getEffectiveConfig().directLineSecret
                ? 'Direct Line secret was saved locally for this browser. Connect agent to start the embedded chat.'
                : 'Browser auth values were saved locally for this machine. App Client ID must come from your Entra SPA/public client registration, not the Copilot Studio Agent app.');
        });
    }

    if (elements.clearConfigButton) {
        elements.clearConfigButton.addEventListener('click', function () {
            clearPersistedRuntimeConfig();
            refreshSetupState();
            setError('');
            setEmptyState('Connect the agent to start a live chat', 'Saved Direct Line secret and browser auth values were cleared from this machine. Enter fresh values or update the config file.');
        });
    }

    [elements.directLineSecretInput, elements.appClientIdInput, elements.tenantIdInput].forEach(function (input) {
        if (!input) return;
        input.addEventListener('input', function () {
            state.msalInstance = null;
            state.msalKey = '';
            refreshSetupState();
        });
    });

    bindPromptButtons();
    updateButtons();
}

initializeAgentUi();