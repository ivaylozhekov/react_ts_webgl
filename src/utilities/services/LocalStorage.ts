interface Backup {
  [index: string]: string;
}

class LocalStorage {

  public static getInstance(): LocalStorage {
    return LocalStorage.instance || (LocalStorage.instance = new LocalStorage());
  };

  private static instance: LocalStorage;

  public isSupported(): boolean {
    try {
      let itemBackup = localStorage.getItem('');
      localStorage.removeItem('');
      localStorage.setItem('', itemBackup);
      if (itemBackup === null) {
        localStorage.removeItem('');
      } else {
        localStorage.setItem('', itemBackup);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  public hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  public getItem(key: string): string {
    if (this.hasItem(key)) {
      return localStorage.getItem(key);
    } else {
      throw new Error(`LocalStorage item ${key} does not exists`);
    }
  }

  public setItem(key: string, value: string, overwrite: boolean = false): boolean {
    if (this.hasItem(key) && overwrite === false) {
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  }

  public removeItem(key: string) {
    localStorage.removeItem(key);
  }

  public removeAllItems() {
    localStorage.clear();
  }

  public getRemainingSpace(): number {
    let itemBackup = localStorage.getItem('');
    let increase = true;
    let data = '1';
    let totalData = '';
    let trytotalData = '';
    while (true) {
      try {
        trytotalData = totalData + data;
        localStorage.setItem('', trytotalData);
        totalData = trytotalData;
        if (increase) {
          data += data;
        }
      } catch (e) {
        if (data.length < 2) {
          break;
        }
        increase = false;
        data = data.substr(data.length / 2);
      }
    }
    if (itemBackup === null) {
      localStorage.removeItem('');
    } else {
      localStorage.setItem('', itemBackup);
    }

    return totalData.length;
  }

  public getMaximumSpace(): number {
    let backup = this.getBackup();
    localStorage.clear();
    let max = this.getRemainingSpace();
    this.applyBackup(backup);
    return max;
  }

  public getUsedSpace(): number {
    let sum = 0;

    for (let i = 0; i < localStorage.length; ++i) {
      let key = localStorage.key(i);
      let value = localStorage.getItem(key);
      sum += key.length + value.length;
    }

    return sum;
  }

  public getItemUsedSpace(key: string): number {
    let value = localStorage.getItem(key);
    if (value === null) {
      return NaN;
    } else {
      return key.length + value.length;
    }
  }

  public getBackup(): Backup {
    let backup: Backup = {};

    for (let i = 0; i < localStorage.length; ++i) {
      let key = localStorage.key(i);
      let value = localStorage.getItem(key);
      backup[key] = value;
    }

    return backup;
  }

  public applyBackup(backup: Backup, fClear: boolean = true, fOverwriteExisting: boolean = true) {
    if (fClear === true) {
      localStorage.clear();
    }

    for (let key in backup) {
      if (fOverwriteExisting === false && backup[key] !== undefined) {
        continue;
      }
      let value = backup[key];
      localStorage.setItem(key, value);
    }
  }

}

export default LocalStorage.getInstance();
