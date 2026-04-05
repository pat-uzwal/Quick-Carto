import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const UserLayout = () => {
    return (
        <div className="min-h-screen bg-white text-text-primary flex flex-col">
            <Navbar />
            <main className="flex-1 w-full flex flex-col items-center">
                <Outlet />
            </main>

        </div>
    );
};

export default UserLayout;
