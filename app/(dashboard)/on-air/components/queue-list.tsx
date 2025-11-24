'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Music, GripVertical, X, Play, Clock } from 'lucide-react';
import { QueueItem } from '../hooks/use-onair-socket';

interface QueueListProps {
  queue: QueueItem[];
  onUpdateQueue: (items: QueueItem[]) => void;
  onRemoveItem: (itemId: string) => void;
  onPlayNext: () => void;
  onPlayItem?: (queueItemId: string) => void;
}

function SortableQueueItem({
  item,
  onRemove,
  onPlay,
}: {
  item: QueueItem;
  onRemove: (id: string) => void;
  onPlay?: (itemId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-lg p-4 transition-all"
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-purple-400 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Position Number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-sm">
          {item.position}
        </div>

        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{item.title}</h4>
          {item.artist && (
            <p className="text-sm text-slate-400 truncate">{item.artist}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
              {item.itemType}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(item.duration)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onPlay?.(item.id)}
            className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
            title="Play Now"
          >
            <Play className="w-5 h-5" />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Remove from Queue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function QueueList({
  queue,
  onUpdateQueue,
  onRemoveItem,
  onPlayNext,
  onPlayItem,
}: QueueListProps) {
  const [items, setItems] = useState(queue);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          position: index + 1,
        })
      );

      setItems(newItems);
      onUpdateQueue(newItems);
    }
  };

  // Update local state when queue prop changes
  useEffect(() => {
    setItems(queue);
  }, [queue]);

  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Up Next</h3>
          <p className="text-sm text-slate-400">
            {items.length} {items.length === 1 ? 'item' : 'items'} • Total:{' '}
            {formatTotalDuration(totalDuration)}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onPlayNext}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-medium shadow-lg"
          >
            <Play className="w-4 h-4" />
            Play Next
          </button>
        )}
      </div>

      {/* Queue Items */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">Queue is empty</p>
          <p className="text-sm mt-1">Add songs from the library below</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <SortableQueueItem
                  key={item.id}
                  item={item}
                  onRemove={onRemoveItem}
                  onPlay={onPlayItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
