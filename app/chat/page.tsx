'use client';

import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] overflow-hidden">
      <ChatInterface />
    </div>
  );
}
