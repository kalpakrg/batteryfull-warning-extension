/*
 * Copyright (C) 2014 Kalpak Gadre kalpakrg@gmail.com
 *
 * batteryfull-warning-extension is free software: you can redistribute it and/or modify it under the terms of 
 * the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, 
 * or (at your option) any later version.
 *
 * batteryfull-warning-extension is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General 
 * Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with gnome-shell-extension-weather. 
 * If not, see http://www.gnu.org/licenses/.
 */
const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const UPower = imports.gi.UPowerGlib;
const MessageTray = imports.ui.messageTray;

const BUS_NAME = 'org.freedesktop.UPower';
const OBJECT_PATH = '/org/freedesktop/UPower/devices/DisplayDevice';

const DisplayDeviceInterface = '<node> \
<interface name="org.freedesktop.UPower.Device"> \
  <property name="Type" type="u" access="read"/> \
  <property name="State" type="u" access="read"/> \
  <property name="Percentage" type="d" access="read"/> \
  <property name="TimeToEmpty" type="x" access="read"/> \
  <property name="TimeToFull" type="x" access="read"/> \
  <property name="IsPresent" type="b" access="read"/> \
  <property name="IconName" type="s" access="read"/> \
  <property name="Energy" type="d" access="read"/> \
  <property name="EnergyFull" type="d" access="read"/> \
</interface> \
</node>';

const PowerManagerProxy = Gio.DBusProxy.makeProxyWrapper(DisplayDeviceInterface);

const BatteryLifeExt = new Lang.Class({
	Name: 'BatteryLifeExt',
	
	_init: function() {
		this.parent();
		this._enabled = false;
		this._nofiticationSource = new MessageTray.Source("Battery Life Extension", 'avatar-default');
        this._proxy = new PowerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH,
                                    Lang.bind(this, function(proxy, error) {
                        				if (error) {
                                            log(error.message);
                                            return;
                                        }
                                      
                                        this._proxy.connect('g-properties-changed',
                                                            Lang.bind(this, this._checkBattery));

                                        this._checkBattery();
                                    }));

        log("[BatteryLifeExt] BatteryLifeExt object initialized");

        Main.messageTray.add(this._nofiticationSource);
	},

	_checkBattery: function() {
		if(this._enabled) {
			if (this._isPluggedInAndFullyCharged()) {
				log("[BatteryLifeExt] Battery Fully Charged");
				this._notifyBatteryFullyCharged();
			}
		}
	},

	_isPluggedInAndFullyCharged: function() {
		return this._proxy.TimeToEmpty == 0 && this._proxy.TimeToFull == 0 &&
			Math.round(this._proxy.Energy * 100) == Math.round(this._proxy.EnergyFull * 100);

	},

	_notifyBatteryFullyCharged: function() {
		let notification = new MessageTray.Notification(
			this._nofiticationSource,
			'Battery Fully Charged!', 
			'Your battery is fully charged, consider pugging out the power source to enhance battery life.');

		this._nofiticationSource.notify(notification);
	},
	
	enable: function() {
		this._enabled = true;
	},
	
	disable: function() {
		this._enabled = false;
	},

});

let batteryLifeExt;

function init() {
	log("[BatteryLifeExt] init invoked");
	batteryLifeExt = new BatteryLifeExt();
}

function enable() {
	batteryLifeExt.enable();
}

function disable() {
	batteryLifeExt.disable();
}
