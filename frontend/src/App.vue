<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-4">WhatsApp Multi-Session Dashboard</h1>

    <div class="mb-4">
      <input
        v-model="newSessionName"
        type="text"
        placeholder="Enter new session name"
        class="border border-gray-300 rounded px-3 py-2 mr-2"
      />
      <button
        @click="createSession"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Create Session
      </button>
    </div>

    <div v-if="sessions.length === 0" class="text-gray-600">
      No sessions found.
    </div>

    <ul>
      <li
        v-for="session in sessions"
        :key="session.id"
        class="flex items-center justify-between border-b border-gray-200 py-2"
      >
        <span class="font-semibold">{{ session.session_name }}</span>
        <button
          @click="showQRCode(session.session_name)"
          class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
        >
          Show QR
        </button>
      </li>
    </ul>

    <div v-if="qrModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded shadow-lg max-w-sm w-full">
        <h2 class="text-xl font-semibold mb-4">Scan QR Code</h2>
        <div v-if="qrCode">
          <img :src="qrCode" alt="QR Code" class="mx-auto" />
        </div>
        <div v-else class="text-center text-gray-600">Waiting for QR code...</div>
        <button
          @click="closeQRModal"
          class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition w-full"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      sessions: [],
      newSessionName: '',
      qrModalVisible: false,
      qrCode: null,
      ws: null,
      currentSession: null,
    };
  },
  methods: {
    async fetchSessions() {
      try {
        const res = await axios.get('http://localhost:3001/sessions');
        this.sessions = res.data.sessions || [];
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    },
    async createSession() {
      if (!this.newSessionName) return;
      try {
        await axios.post('http://localhost:3001/sessions', {
          sessionName: this.newSessionName,
        });
        this.newSessionName = '';
        this.fetchSessions();
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    },
    showQRCode(sessionName) {
      this.qrCode = null;
      this.qrModalVisible = true;
      this.currentSession = sessionName;
      if (this.ws) {
        this.ws.close();
      }
      this.ws = new WebSocket(`ws://localhost:3001?sessionName=${sessionName}`);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'qr') {
          this.qrCode = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data.qr)}&size=200x200`;
        } else if (data.type === 'ready') {
          this.qrCode = null;
          this.qrModalVisible = false;
          alert(`Session ${sessionName} is ready!`);
          this.fetchSessions();
        }
      };
      this.ws.onclose = () => {
        this.ws = null;
      };
    },
    closeQRModal() {
      this.qrModalVisible = false;
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    },
  },
  mounted() {
    this.fetchSessions();
  },
  beforeUnmount() {
    if (this.ws) {
      this.ws.close();
    }
  },
};
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
