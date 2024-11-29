using BepInEx;
using BepInEx.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static EntryPointSelector.LocationSelectPatch;

namespace EntryPointSelector
{
    // first string below is your plugin's GUID, it MUST be unique to any other mod. Read more about it in BepInEx docs. Be sure to update it if you copy this project.
    [BepInPlugin("9291A9D9-F671-4EA9-95C1-352F3C0FE233", "Entry Point Selector", "1.2.0")]

    public class Plugin : BaseUnityPlugin
    {
        public static ManualLogSource LogSource;

        // BaseUnityPlugin inherits MonoBehaviour, so you can use base unity functions like Awake() and Update()
        private void Awake()
        {
            new LocationSelectPatch().Enable();

            // save the Logger to variable so we can use it elsewhere in the project
            LogSource = Logger;
            LogSource.LogInfo("plugin loaded!");

            // uncomment line(s) below to enable desired example patch, then press F6 to build the project:
            // new SimplePatch().Enable();
        }
    }

}