const logger = require('../../../../utils/logger').child({ __filename });
const AndroidDeviceAllocation  = require('../AndroidDeviceAllocation');

const DetoxEmulatorsPortRange = {
  min: 10000,
  max: 20000
};

class AllocationResult {
  constructor(adbName, placeholderPort) {
    this.adbName = adbName;
    this.placeholderPort = placeholderPort;
  }

  get isRunning() {
    return !this.placeholderPort;
  }
}

// TODO ASDASD rename
class EmulatorDeviceAllocation extends AndroidDeviceAllocation {

  constructor(deviceRegistry, freeDeviceFinder, rand = Math.random) {
    super(deviceRegistry, undefined, logger); // TODO ASDASD remove 'undefined'
    this._freeDeviceFinder = freeDeviceFinder;
    this._rand = rand;
  }

  /**
   * @param avdName
   * @returns {Promise<AllocationResult>}
   */
  async allocateDevice(avdName) {
    this._logAllocationAttempt(avdName);

    const result = await this._doSynchronizedAllocation(avdName);
    this._logAllocationResult(avdName, result.adbName);

    return result;
  }

  async deallocateDevice(adbName) {
    await this._deviceRegistry.disposeDevice(adbName);
  }

  /**
   * @returns {Promise<AllocationResult>}
   * @private
   */
  async _doSynchronizedAllocation(avdName) {
    let placeholderPort = null;
    let adbName = null;

    await this._deviceRegistry.allocateDevice(async () => {
      adbName = await this._freeDeviceFinder.findFreeDevice(avdName);
      if (!adbName) {
        placeholderPort = this._allocateEmulatorPlaceholderPort();
        adbName = `emulator-${placeholderPort}`;
      }
      return adbName;
    });

    return new AllocationResult(adbName, placeholderPort);
  }

  _allocateEmulatorPlaceholderPort() {
    const { min, max } = DetoxEmulatorsPortRange;
    let port = this._rand() * (max - min) + min;
    port = port & 0xFFFFFFFE; // Should always be even
    return port;
  }
}

module.exports = EmulatorDeviceAllocation;
