import {LibraryStreamEntity} from '../Type/StreamEntity';
import {IssueRepo} from './IssueRepo';

const originalLibraryStreams: LibraryStreamEntity[] = [
  {id: -1000, name: 'Inbox',     defaultFilter: 'is:unarchived', iconName: 'inbox', unreadCount: 0},
  {id: -1001, name: 'Unread',    defaultFilter: 'is:unarchived is:unread', iconName: 'folder', unreadCount: 0},
  {id: -1002, name: 'Open',      defaultFilter: 'is:unarchived is:open', iconName: 'file-document', unreadCount: 0},
  {id: -1003, name: 'Star',      defaultFilter: 'is:unarchived is:star', iconName: 'star', unreadCount: 0},
  {id: -1004, name: 'Archived',  defaultFilter: 'is:archived', iconName: 'archive', unreadCount: 0,},
]

class _LibraryStreamRepo {
  private async relations(libraryStreams: LibraryStreamEntity[]) {
    if (!libraryStreams.length) return;
    await this.relationUnreadCount(libraryStreams);
  }

  private async relationUnreadCount(libraryStreams: LibraryStreamEntity[]) {
    const promises = libraryStreams.map(s => IssueRepo.getUnreadCountInStream(null, s.defaultFilter, ''));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return console.error(error);

    libraryStreams.forEach((libraryStream, index) => {
      libraryStream.unreadCount = results[index].count;
    });
  }

  async getAllLibraryStreams(): Promise<{error?: Error; libraryStreams?: LibraryStreamEntity[]}> {
    const libraryStreams: LibraryStreamEntity[] = originalLibraryStreams.map(v => ({...v}));
    await this.relations(libraryStreams);

    return {libraryStreams};
  }

  async getLibraryStream(name: string): Promise<{error?: Error; libraryStream?: LibraryStreamEntity}> {
    const libraryStreamEntity = originalLibraryStreams.find(v => v.name === name);
    if (!libraryStreamEntity) return {error: new Error(`not found library stream. name = ${name}`)};

    const libraryStream: LibraryStreamEntity = {...libraryStreamEntity};
    await this.relations([libraryStream]);
    return {libraryStream};
  }
}

export const LibraryStreamRepo = new _LibraryStreamRepo();
