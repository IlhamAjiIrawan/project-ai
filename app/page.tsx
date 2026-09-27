'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { RecentSessionsSection } from '@/components/dashboard/RecentSessionsSection';
import { CategoryFilterBar } from '@/components/dashboard/CategoryFilterBar';
import { CharacterGrid } from '@/components/dashboard/CharacterGrid';

export default function DashboardPage() {
  const characters = useLiveQuery(() => db.characters.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.chatSessions.orderBy('updatedAt').reverse().toArray(), []) || [];
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      const matchesCategory = selectedCategory === 'all' || char.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        char.name.toLowerCase().includes(q) ||
        char.tagline.toLowerCase().includes(q) ||
        char.description.toLowerCase().includes(q) ||
        char.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [characters, selectedCategory, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-7 max-w-7xl mx-auto w-full">
      {/* 1. Hero & Quick Stats */}
      <HeroSection
        charactersCount={characters.length}
        sessionsCount={sessions.length}
        personasCount={personas.length}
      />

      {/* 2. Recent Active Sessions */}
      <RecentSessionsSection
        sessions={sessions}
        characters={characters}
      />

      {/* 3. Search & Category Filters */}
      <CategoryFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        totalResultsCount={filteredCharacters.length}
      />

      {/* 4. Character Gallery Grid */}
      <CharacterGrid
        characters={filteredCharacters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
