using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;
using UnityEditor;
using Newtonsoft.Json.Linq;

namespace McpUnity.Resources
{
    /// <summary>
    /// Resource for retrieving all available Unity menu items
    /// </summary>
    public class MenuItemResource : McpResourceBase
    {
        public MenuItemResource()
        {
            Name = "get_menu_items";
            Description = "Retrieves a list of all available Unity menu items";
        }
        
        /// <summary>
        /// Get the parameter schema for this resource
        /// </summary>
        /// <returns>A JObject describing the parameter schema</returns>
        protected override JObject GetParameterSchema()
        {
            // No parameters needed for this resource
            return new JObject();
        }
        
        /// <summary>
        /// Fetch all available menu items in the Unity Editor
        /// </summary>
        /// <param name="parameters">Resource parameters as a JObject (not used)</param>
        /// <returns>A JObject containing the list of menu items</returns>
        public override JObject Fetch(JObject parameters)
        {
            // Get all menu items
            JArray menuItems = GetAllMenuItems();
                
            // Create the response
            return new JObject
            {
                ["success"] = true,
                ["message"] = $"Retrieved {menuItems.Count} menu items",
                ["menuItems"] = menuItems
            };
        }
        
        /// <summary>
        /// Get all available menu items in the Unity Editor
        /// </summary>
        /// <returns>A list of menu item paths</returns>
        private JArray GetAllMenuItems()
        {
            var menuItemsArray = new JArray();
            
            // Find all methods with MenuItem attribute in loaded assemblies
            var assemblies = AppDomain.CurrentDomain.GetAssemblies();
            foreach (var assembly in assemblies)
            {
                // Skip system assemblies to improve performance
                if (assembly.FullName.StartsWith("System.") || 
                    assembly.FullName.StartsWith("Microsoft.") ||
                    assembly.FullName.StartsWith("mscorlib"))
                {
                    continue;
                }
                    
                foreach (var type in assembly.GetTypes())
                {
                    foreach (var method in type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static))
                    {
                        var menuItemAttributes = method.GetCustomAttributes(typeof(MenuItem), false);
                        foreach (MenuItem menuItemAttribute in menuItemAttributes)
                        {
                            // Ignore object type context menu items
                            if(menuItemAttribute.menuItem.StartsWith("CONTEXT")) continue;
                            
                            menuItemsArray.Add(menuItemAttribute.menuItem);
                        }
                    }
                }
            }
            
            return menuItemsArray;
        }
    }
}
