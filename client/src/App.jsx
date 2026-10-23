import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import DashboardOverview from './components/DashboardOverview.jsx';
import ServerManagement from './components/ServerManagement.jsx';
import PanelEditor from './components/PanelEditor.jsx';
import TicketHistory from './components/TicketHistory.jsx';
import Settings from './components/Settings.jsx';
import AuditLogs from './components/AuditLogs.jsx';
import ServerEmojis from './components/ServerEmojis.jsx';
import LoginPage from './components/LoginPage.jsx';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('adam_admin_auth') === 'authenticated';
  });
  const [currentTab, setCurrentTab] = useState('panels'); // Default to Panels
  const [stats, setStats] = useState(null);
  const [panels, setPanels] = useState({});
  const [activePanel, setActivePanel] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [settings, setSettings] = useState({});
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [serverCategories, setServerCategories] = useState([]);
  const [botStatus, setBotStatus] = useState({ online: false });

  const [selectedGuildId, setSelectedGuildId] = useState('');

  // Fetch initial data
  const fetchData = async (guildId = selectedGuildId) => {
    try {
      const gParam = guildId ? `?guildId=${guildId}` : '';
      const [resStats, resPanels, resTickets, resSettings, resChannels, resRoles, resEmojis, resCategories, resStatus] = await Promise.all([
        fetch(`/api/stats${gParam}`).then(r => r.json()),
        fetch('/api/panels').then(r => r.json()),
        fetch('/api/tickets').then(r => r.json()),
        fetch(`/api/settings${gParam}`).then(r => r.json()),
        fetch(`/api/discord/channels${gParam}`).then(r => r.json()),
        fetch(`/api/discord/roles${gParam}`).then(r => r.json()),
        fetch(`/api/discord/emojis${gParam}`).then(r => r.json()),
        fetch(`/api/discord/categories${gParam}`).then(r => r.json()),
        fetch('/api/bot/status').then(r => r.json()),
      ]);

      setStats(resStats);
      setPanels(resPanels);
      setActivePanel(resPanels['default-purchase-panel'] || Object.values(resPanels)[0]);
      setTickets(resTickets);
      setSettings(resSettings);
      setChannels(resChannels);
      setRoles(resRoles);
      setEmojis(resEmojis);
      setServerCategories(resCategories);
      setBotStatus(resStatus);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleSelectGuild = (gId) => {
    setSelectedGuildId(gId);
    fetchData(gId);
  };

  useEffect(() => {
    fetchData();

    // Setup WebSocket for live updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.event === 'ticket_created' || message.event === 'ticket_updated' || message.event === 'ticket_closed') {
          fetchData();
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    return () => socket.close();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adam_admin_token');
    return {
      'Content-Type': 'application/json',
      'x-adam-admin-auth': 'authenticated',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const handleSavePanel = async (updatedPanel) => {
    try {
      const res = await fetch(`/api/panels/${updatedPanel.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedPanel)
      });
      const data = await res.json();
      if (data.success) {
        setActivePanel(data.panel);
        fetchData();
      }
    } catch (err) {
      console.error('Save panel error:', err);
    }
  };

  const handleDeployPanel = async (panelId, channelId) => {
    const res = await fetch(`/api/panels/${panelId}/deploy`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ channelId })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Deploy failed');
    }
    return data;
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/close`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Close ticket error:', err);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (err) {
      console.error('Save settings error:', err);
    }
  };

  const tabTitles = {
    dashboard: 'Server Management',
    panels: 'Panels & Embed Builder',
    templates: 'Templates',
    history: 'Ticket History',
    applications: 'Applications',
    custom_commands: 'Custom Commands',
    statistics: 'Statistics',
    settings: 'Settings',
    permissions: 'Permissions',
    audit_logs: 'Audit Logs',
    personalizer: 'Bot Personalizer',
    emojis: 'Server Emojis'
  };

  const handleLogout = () => {
    localStorage.removeItem('adam_admin_auth');
    localStorage.removeItem('adam_admin_user');
    localStorage.removeItem('adam_admin_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0b0b0d] text-zinc-100 font-sans">
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        serverInfo={settings}
        selectedGuildId={selectedGuildId}
        onSelectGuild={handleSelectGuild}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          botStatus={botStatus} 
          currentTabTitle={tabTitles[currentTab] || 'Server Management'} 
          activeServer={stats?.activeServer}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto pb-12">
          {currentTab === 'dashboard' && (
            <DashboardOverview 
              stats={stats} 
              tickets={tickets} 
              onSelectTicket={() => setCurrentTab('history')} 
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'server_management' && (
            <ServerManagement 
              onSelectServer={(serverId) => setCurrentTab('panels')}
              serverInfo={settings}
            />
          )}

          {currentTab === 'panels' && (
            <PanelEditor 
              panelData={activePanel} 
              panels={panels}
              onSave={handleSavePanel} 
              onDeploy={handleDeployPanel} 
              channels={channels} 
              roles={roles} 
              emojis={emojis}
              categories={serverCategories}
            />
          )}

          {currentTab === 'emojis' && (
            <ServerEmojis 
              emojis={emojis} 
              serverInfo={settings} 
            />
          )}

          {currentTab === 'history' && (
            <TicketHistory 
              tickets={tickets} 
              onCloseTicket={handleCloseTicket} 
            />
          )}

          {currentTab === 'settings' && (
            <Settings 
              settings={settings} 
              onSaveSettings={handleSaveSettings} 
            />
          )}

          {currentTab === 'audit_logs' && (
            <AuditLogs />
          )}

          {!['dashboard', 'panels', 'emojis', 'history', 'settings', 'audit_logs'].includes(currentTab) && (
            <div className="p-12 text-center text-zinc-500 space-y-3">
              <div className="text-4xl">👑</div>
              <h2 className="text-lg font-bold text-zinc-300 capitalize">{tabTitles[currentTab]} Module</h2>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                This section is configured and ready for additional custom module expansions in your local environment.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
