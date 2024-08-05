import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, FlatList, TouchableOpacity, Button, Alert } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';

const firebaseConfig = {
   apiKey: "AIzaSyCrdA3VYohgqhKsokBvVrxbLoiOBO2keDk",
   authDomain: "emilia-react2.firebaseapp.com",
   projectId: "emilia-react2",
   storageBucket: "emilia-react2.appspot.com",
   messagingSenderId: "876251897363",
   appId: "1:876251897363:web:f30550672064811a4729e6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const BookContext = createContext();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: {
        backgroundColor: '#3d8ecc',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
      <Stack.Screen name="BooksList" component={BooksListScreen} options={{ title: 'Books List' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Detail' }} />
    </Stack.Navigator>
  );
}

function BooksListScreen({ navigation }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'book'), (querySnapshot) => {
      const books = [];
      querySnapshot.forEach((doc) => {
        books.push({ ...doc.data(), id: doc.id });
      });
      setBooks(books);
      console.log("\n\nBooks:-",querySnapshot.docs);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View>
      <FlatList
        style={{ padding: 16 }}
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ padding: 16, backgroundColor: 'lightblue', marginBottom: 16 }} onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}>
            <Text style={{ fontWeight: 'bold', fontSize: 20 }}>{item.name}</Text>
            <Text>{item.author}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function BookDetailScreen({ route }) {
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const { borrowedBooks, borrowBook } = useContext(BookContext);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'book', bookId), (doc) => {
      setBook(doc.data());
    });

    return () => unsubscribe();
  }, [bookId]);

  const handleBorrowBook = () => {
    if (borrowedBooks.length >= 3) {
      Alert.alert('Limit reached', 'You cannot borrow more than 3 books at a time.');
    } else {
      borrowBook(book);
    }
  };

  if (!book) {
    return <Text style={{padding: 30}}>Loading...</Text>;
  }

  return (
    <View style={{padding: 16}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={{ fontWeight: 'bold', fontSize: 20}}>{book.name}</Text>
        <Text>{"Rating: "+book.rating}</Text>
      </View>   
      <Text style={{ fontWeight: 'bold', color: 'grey', marginVertical: 10}}>{book.author}</Text> 
      <Text style={{color:'grey'}}>{book.summary}</Text><Text>{"\n"}</Text>
      <Button title="Borrow" onPress={handleBorrowBook} />
    </View>
  );
}

function BorrowedBooksScreen() {
  const { borrowedBooks, returnBook } = useContext(BookContext);

  return (
    <View style={{padding: 16}}>
      <FlatList
        data={borrowedBooks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text style={{ fontWeight: 'bold', fontSize: 20}}>{item.name}</Text>
            <Text style={{ fontWeight: 'bold', color: 'grey', marginTop: 10}}>{item.author}</Text><Text>{"\n"}</Text>
            <Button title="Return" onPress={() => returnBook(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

function BookProvider({ children }) {
  const [borrowedBooks, setBorrowedBooks] = useState([]);

  const borrowBook = (book) => {
    setBorrowedBooks([...borrowedBooks, book]);
  };

  const returnBook = (bookId) => {
    setBorrowedBooks(borrowedBooks.filter(book => book.id !== bookId));
  };

  return (
    <BookContext.Provider value={{ borrowedBooks, borrowBook, returnBook }}>
      {children}
    </BookContext.Provider>
  );
}

export default function App() {
  return (
    <BookProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{
          headerStyle: {
            backgroundColor: 'darkblue',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
          <Tab.Screen name="Home" component={HomeStack} options={{ tabBarIcon: ({color})=> (<FontAwesome5 name="home" size={15} color={color}/>) }}/>
          <Tab.Screen name="Borrowed" component={BorrowedBooksScreen} options={{ tabBarIcon: ({color})=> (<FontAwesome5 name="receipt" size={15} color={color}/>) }}/>
        </Tab.Navigator>
      </NavigationContainer>
    </BookProvider>
  );
}
