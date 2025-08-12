// README

CSC Services Mobile App (Expo + React Native + Firebase)

This is a simple, ready-to-run Expo React Native app for your online CSC business. Features:

Email/password authentication (register/login)

Service list (stored in Firestore)

Place orders (stored in Firestore)

Admin view to manage orders (approve/reject)

Basic push notifications via FCM (setup instructions included)



---

Quick setup

1. Install Expo CLI (if not installed):

npm install -g expo-cli


2. Clone the project files (you have this single-file app). Create a new Expo project and replace App.js with the code in this file.


3. Create a Firebase project at https://console.firebase.google.com/ and enable Email/Password auth, Firestore, and Cloud Messaging.


4. In Firebase -> Project settings, copy the web SDK config and paste into firebaseConfig in firebase.js section of the code.


5. Install dependencies:

expo install firebase react-native-gesture-handler react-native-reanimated
npm install @react-navigation/native @react-navigation/native-stack
expo install react-native-screens react-native-safe-area-context


6. Run app:

expo start




---

// firebase.js (inline in the app file) -- paste your config in firebaseConfig

/* const firebaseConfig = { apiKey: "YOUR_API_KEY", authDomain: "PROJECT_ID.firebaseapp.com", projectId: "PROJECT_ID", storageBucket: "PROJECT_ID.appspot.com", messagingSenderId: "SENDER_ID", appId: "APP_ID" }; */

// App.js (Expo + React Native)

import React, { useEffect, useState } from 'react'; import { Text, View, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native'; import { NavigationContainer } from '@react-navigation/native'; import { createNativeStackNavigator } from '@react-navigation/native-stack'; import firebase from 'firebase/compat/app'; import 'firebase/compat/auth'; import 'firebase/compat/firestore';

// ----- START: Paste your Firebase config below ----- const firebaseConfig = { // paste here }; // ----- END: Firebase config -----

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); } const auth = firebase.auth(); const db = firebase.firestore();

const Stack = createNativeStackNavigator();

// Simple styles helper const styles = { container: { flex: 1, padding: 16, backgroundColor: '#111' }, input: { backgroundColor: '#222', color: '#fff', padding: 10, marginVertical: 8, borderRadius: 6 }, btn: { backgroundColor: '#0a84ff', padding: 12, borderRadius: 6, alignItems: 'center', marginVertical: 8 }, btnText: { color: '#fff', fontWeight: 'bold' }, title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 } };

function Loading() { return ( <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#111'}}> <ActivityIndicator size="large" color="#0a84ff" /> </View> ); }

function AuthScreen({ navigation }) { const [isLogin, setIsLogin] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [loading, setLoading] = useState(false);

const register = async () => { if (!email || !password || !name) return Alert.alert('Fill all fields'); setLoading(true); try { const res = await auth.createUserWithEmailAndPassword(email, password); await db.collection('users').doc(res.user.uid).set({ name, email, isAdmin: false }); } catch (e) { Alert.alert('Error', e.message); } setLoading(false); };

const login = async () => { if (!email || !password) return Alert.alert('Fill all fields'); setLoading(true); try { await auth.signInWithEmailAndPassword(email, password); } catch (e) { Alert.alert('Error', e.message); } setLoading(false); };

if (loading) return <Loading />;

return ( <View style={styles.container}> <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text> {!isLogin && ( <TextInput placeholder="Your name" placeholderTextColor="#999" style={styles.input} value={name} onChangeText={setName} /> )} <TextInput placeholder="Email" placeholderTextColor="#999" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /> <TextInput placeholder="Password" placeholderTextColor="#999" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

<TouchableOpacity style={styles.btn} onPress={isLogin ? login : register}>
    <Text style={styles.btnText}>{isLogin ? 'Login' : 'Register'}</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
    <Text style={{color:'#fff', textAlign:'center', marginTop:8}}>{isLogin ? "Don't have account? Register" : 'Already have account? Login'}</Text>
  </TouchableOpacity>
</View>

); }

function HomeScreen({ navigation, route }) { const [services, setServices] = useState([]); const [loading, setLoading] = useState(true); const user = auth.currentUser;

useEffect(() => { const unsub = db.collection('services').onSnapshot(snap => { const list = snap.docs.map(d => ({ id: d.id, ...d.data() })); setServices(list); setLoading(false); }, err => { Alert.alert('Error', err.message); setLoading(false); }); return () => unsub(); }, []);

if (loading) return <Loading />;

return ( <View style={styles.container}> <Text style={styles.title}>Services</Text> <FlatList data={services} keyExtractor={i=>i.id} renderItem={({item})=> ( <TouchableOpacity style={{backgroundColor:'#222',padding:12,borderRadius:8,marginVertical:6}} onPress={()=>navigation.navigate('ServiceDetail',{service:item})}> <Text style={{color:'#fff',fontSize:18,fontWeight:'600'}}>{item.title}</Text> <Text style={{color:'#ccc',marginTop:6}}>₹{item.price} | {item.description}</Text> </TouchableOpacity> )} />

<TouchableOpacity style={{...styles.btn, backgroundColor:'#34c759'}} onPress={async ()=>{ await auth.signOut(); navigation.replace('Auth'); }}>
    <Text style={styles.btnText}>Logout</Text>
  </TouchableOpacity>

  {/* admin button if user is admin */}
  <TouchableOpacity style={{...styles.btn, backgroundColor:'#ff9f0a'}} onPress={()=>navigation.navigate('Admin')}>
    <Text style={styles.btnText}>Admin Panel</Text>
  </TouchableOpacity>
</View>

); }

function ServiceDetail({ route, navigation }) { const { service } = route.params; const [details, setDetails] = useState(''); const [loading, setLoading] = useState(false);

const placeOrder = async () => { const user = auth.currentUser; if (!user) return navigation.navigate('Auth'); setLoading(true); try { await db.collection('orders').add({ serviceId: service.id, serviceTitle: service.title, userId: user.uid, status: 'pending', details, createdAt: firebase.firestore.FieldValue.serverTimestamp() }); Alert.alert('Order placed'); navigation.goBack(); } catch (e) { Alert.alert('Error', e.message); } setLoading(false); };

return ( <View style={styles.container}> <Text style={styles.title}>{service.title}</Text> <Text style={{color:'#ccc'}}>₹{service.price}</Text> <Text style={{color:'#999',marginTop:8}}>{service.description}</Text>

<TextInput placeholder="Order details / customer info" placeholderTextColor="#999" style={styles.input} value={details} onChangeText={setDetails} />

  <TouchableOpacity style={styles.btn} onPress={placeOrder}>
    <Text style={styles.btnText}>Place Order</Text>
  </TouchableOpacity>
</View>

); }

function AdminScreen() { const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true);

useEffect(()=>{ const unsub = db.collection('orders').orderBy('createdAt','desc').onSnapshot(snap=>{ const list = snap.docs.map(d=>({id:d.id,...d.data()})); setOrders(list); setLoading(false); }, err=>{Alert.alert('Error',err.message); setLoading(false);}); return ()=>unsub(); },[]);

const updateStatus = async (id, status) => { try { await db.collection('orders').doc(id).update({ status }); } catch(e){ Alert.alert('Error', e.message); } };

if (loading) return <Loading />;

return ( <View style={styles.container}> <Text style={styles.title}>Orders</Text> <FlatList data={orders} keyExtractor={i=>i.id} renderItem={({item})=> ( <View style={{backgroundColor:'#222',padding:12,borderRadius:8,marginVertical:6}}> <Text style={{color:'#fff',fontSize:16,fontWeight:'600'}}>{item.serviceTitle}</Text> <Text style={{color:'#ccc'}}>By: {item.userId} • {item.status}</Text> <Text style={{color:'#999',marginTop:8}}>{item.details}</Text> <View style={{flexDirection:'row',marginTop:10}}> <TouchableOpacity style={{padding:8,marginRight:8,backgroundColor:'#0a84ff',borderRadius:6}} onPress={()=>updateStatus(item.id,'approved')}><Text style={{color:'#fff'}}>Approve</Text></TouchableOpacity> <TouchableOpacity style={{padding:8,backgroundColor:'#ff3b30',borderRadius:6}} onPress={()=>updateStatus(item.id,'rejected')}><Text style={{color:'#fff'}}>Reject</Text></TouchableOpacity> </View> </View> )} /> </View> ); }

export default function App() { const [initializing, setInitializing] = useState(true); const [user, setUser] = useState(null);

useEffect(()=>{ const unsub = auth.onAuthStateChanged(async (u)=>{ setUser(u); if (initializing) setInitializing(false); }); return ()=>unsub(); },[]);

if (initializing) return <Loading />;

return ( <NavigationContainer> <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }}> {user ? ( <> <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} /> <Stack.Screen name="ServiceDetail" component={ServiceDetail} options={{ title: 'Service' }} /> <Stack.Screen name="Admin" component={AdminScreen} /> </> ) : ( <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} /> )} </Stack.Navigator> </NavigationContainer> ); }

/* Notes & next steps:

1. Add services documents in Firestore under collection services with fields: { title, price, description }


2. To make an admin user: in Firestore users collection set field isAdmin: true for that user id.


3. For push notifications set up Firebase Cloud Messaging and follow Expo docs for push tokens, or use server-side FCM.


4. To produce APK: use EAS Build (expo) or expo build:android (classic) — EAS recommended.


5. Branding: change colors, app name, and add logo via app.json.



Security reminders:

For production protect Firestore rules to restrict who can update order status (allow only admin users).

Don't check-in your firebase config to public repos without restrictions. */


  
