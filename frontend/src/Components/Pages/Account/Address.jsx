import React, { useEffect, useState } from "react";
import { useAuth } from "../../../PrivateRouter/AuthContext";
import api from "../../../api";
import { readUserAddresses, saveUserAddresses, upsertUserAddress, removeUserAddress } from "../../../utils/addressStorage";

export default function Address() {

  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    order_id: null,
    user_id: user?.user_id || "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    street_address: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    zip_code: ""
  });

  const fetchAddresses = async () => {
    if (!user?.user_id) {
      setAddresses([]);
      return;
    }

    try {
      const storageAddresses = readUserAddresses(user.user_id);
      const res = await api.get("/orders");
      const userOrders = (res.data || [])
        .filter((order) => String(order.user_id) === String(user.user_id))
        .map((order) => ({
          id: order.id,
          user_id: order.user_id,
          customer_name: order.customer_name || order.ordered_by_name || "",
          customer_email: order.customer_email || order.ordered_by_email || "",
          customer_phone: order.customer_phone || order.ordered_by_phone || "",
          street_address: order.street_address || "",
          city: order.city || "",
          district: order.district || "",
          state: order.state || "",
          country: order.country || "India",
          zip_code: order.zip_code || "",
        }));

      const mergedAddresses = [...storageAddresses, ...userOrders].filter((address, index, array) => {
        const match = array.findIndex((item) => {
          const first = `${address.customer_name || ""}|${address.customer_email || ""}|${address.customer_phone || ""}|${address.street_address || ""}|${address.city || ""}|${address.district || ""}|${address.state || ""}|${address.country || ""}|${address.zip_code || ""}`;
          const second = `${item.customer_name || ""}|${item.customer_email || ""}|${item.customer_phone || ""}|${item.street_address || ""}|${item.city || ""}|${item.district || ""}|${item.state || ""}|${item.country || ""}|${item.zip_code || ""}`;
          return first === second;
        });
        return match === index;
      });

      saveUserAddresses(user.user_id, mergedAddresses);
      setAddresses(mergedAddresses);
    } catch (error) {
      console.error(error);
      setAddresses(readUserAddresses(user.user_id));
    }
  };

  useEffect(() => {
    if (user?.user_id) fetchAddresses();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addAddress = async () => {

    try {
      if (user?.user_id) {
        const nextAddresses = upsertUserAddress(user.user_id, {
          ...form,
          id: Date.now().toString(),
          user_id: user.user_id,
        });;
        setAddresses(nextAddresses);
      }

      alert("Address saved");

      setForm({
        order_id: null,
        user_id: user?.user_id,
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        street_address: "",
        city: "",
        district: "",
        state: "",
        country: "India",
        zip_code: ""
      });

      fetchAddresses();

    } catch (error) {
      console.error(error);
    }
  };

  const editAddress = (address) => {

    setEditingId(address.id);

    setForm(address);

  };

  const updateAddress = async () => {
    try {
      if (user?.user_id) {
        const updatedAddresses = addresses.map((address) =>
          String(address.id) === String(editingId)
            ? { ...address, ...form, id: editingId, user_id: user.user_id }
            : address
        );

        setAddresses(updatedAddresses);
        saveUserAddresses(user.user_id, updatedAddresses);
      }

      alert("Address updated");

      setEditingId(null);

      setForm({
        order_id: null,
        user_id: user?.user_id || "",
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        street_address: "",
        city: "",
        district: "",
        state: "",
        country: "India",
        zip_code: "",
      });

      fetchAddresses();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteAddress = async (id) => {

    if (!window.confirm("Delete address?")) return;

    try {
      if (user?.user_id) {
        const nextAddresses = removeUserAddress(user.user_id, id);
        setAddresses(nextAddresses);
      }
      fetchAddresses();

    } catch (error) {
      console.error(error);
    }
  };

  return (

    <div className="space-y-8">

      {/* ADDRESS LIST */}

      {addresses.map((address) => (

        <div
          key={address.id}
          className="bg-white border rounded-xl p-6 shadow-sm"
        >

          <p className="text-sm leading-6">

            {address.customer_name} <br />

            {address.street_address} <br />

            {address.city}, {address.district} <br />

            {address.state} - {address.zip_code} <br />

            {address.country} <br />

            Phone: {address.customer_phone} <br />

            Email: {address.customer_email}

          </p>

          <div className="mt-4 flex gap-4">

            <button
              onClick={() => editAddress(address)}
              className="text-blue-600"
            >
              Edit
            </button>

            <button
              onClick={() => deleteAddress(address.id)}
              className="text-red-600"
            >
              Delete
            </button>

          </div>

        </div>

      ))}

      {/* ADDRESS FORM */}

      <div className="bg-white border rounded-xl p-6 shadow">

        <h2 className="font-semibold mb-4">
          {editingId ? "Edit Address" : "Add Address"}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input name="customer_name" placeholder="Full Name" value={form.customer_name} onChange={handleChange} className="border p-3 rounded" />

          <input name="customer_email" placeholder="Email" value={form.customer_email} onChange={handleChange} className="border p-3 rounded" />

          <input name="customer_phone" placeholder="Phone" value={form.customer_phone} onChange={handleChange} className="border p-3 rounded" />

          <textarea name="street_address" placeholder="Street Address" value={form.street_address} onChange={handleChange} className="border p-3 rounded col-span-2" />

          <input name="city" placeholder="City" value={form.city} onChange={handleChange} className="border p-3 rounded" />

          <input name="district" placeholder="District" value={form.district} onChange={handleChange} className="border p-3 rounded" />

          <input name="state" placeholder="State" value={form.state} onChange={handleChange} className="border p-3 rounded" />

          <input name="zip_code" placeholder="Zip Code" value={form.zip_code} onChange={handleChange} className="border p-3 rounded" />

        </div>

        <div className="mt-6">

          {editingId ? (

            <button
              onClick={updateAddress}
              className="bg-primary text-white px-6 py-2 rounded"
            >
              Update Address
            </button>

          ) : (

            <button
              onClick={addAddress}
              className="bg-primary text-white px-6 py-2 rounded"
            >
              Add Address
            </button>

          )}

        </div>

      </div>

    </div>

  );

}