'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMemory,
  faCoffee,
  faCodeBranch,
  faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';

export default function Node() {
  const [node, setNode] = useState({});
  const [error, setError] = useState('');
  const [editedFields, setEditedFields] = useState({});
  const uniqueId = window.location.pathname.split('/').pop();

  useEffect(() => {
    const token = getCookie('token');
    const address = getCookie('address');
    if (!token) {
      window.location.href = '/auth';
      return;
    }
    const uniqueId = window.location.pathname.split('/').pop();
    if (token) {
      //fetch(`process.env.NEXT_PUBLIC_DEV_PROXY_URL + /cluster/${uniqueId}`, {

      const domainurl = address.includes('localhost' || '127.0.0.1')
        ? ''
        : `${process.env.NEXT_PUBLIC_CORS_PROXY_URL}/`;

      fetch(`${domainurl}${address}/cluster/${uniqueId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then((data) => {
          setNode(data.node);
        })
        .catch((error) => {
          deleteCookie('token');
          deleteCookie('username');
          deleteCookie('address');
          window.location.href = '/auth';
          setError(error.message);
        });
    }
  }, []);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  const handleSave = () => {
    const token = getCookie('token');
    const address = getCookie('address');
    if (!token) {
      window.location.href = '/auth';
      return;
    }

    const domainurl = address.includes('localhost' || '127.0.0.1')
      ? ''
      : `${process.env.NEXT_PUBLIC_CORS_PROXY_URL}/`;

    const uniqueId = window.location.pathname.split('/').pop();
    const { IP, Port } = connectionDetailsObj;

    const updatedNode = {
      properties: {},
      uniqueId: `${uniqueId}`,
      listeners: [
        {
          host: editedFields.IP || IP,
          port: editedFields.Port || Port
        }
      ]
    };

    fetch(`${domainurl}${address}/cluster`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedNode)
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Cannot edit master node');
          }
          throw new Error(response.statusText);
        }
        console.log('response', response);
        return response.json();
      })
      .then((data) => {
        setNode(data.node);
        window.location.reload();
        //console.log('data', data);
      })
      .catch((error) => {
        setError(error.message);
        //console.log('error', error);
      });
  };

  const stats = [
    {
      id: 1,
      name: 'Memory',
      icon: faMemory,
      canEdit: false,
      value1: node?.nodeInfoSnapshot && node?.nodeInfoSnapshot?.usedMemory,
      value2: node?.nodeInfoSnapshot && node?.nodeInfoSnapshot?.maxMemory,
      value1Name: 'Used Memory',
      value2Name: 'Max Memory'
    },
    {
      id: 2,
      name: 'Amount of services',
      icon: faCoffee,
      canEdit: false,
      value1: node?.nodeInfoSnapshot?.currentServicesCount,
      value2: '',
      value1Name: 'Current Services Count',
      value2Name: ''
    },
    {
      id: 3,
      name: 'Drain Status',
      icon: faCircleExclamation,
      canEdit: false,
      value1: node?.nodeInfoSnapshot?.drain ? 'Draining' : 'Not Draining',
      value2: '',
      value1Name: 'Drain status',
      value2Name: ''
    },
    {
      id: 4,
      name: 'Version',
      icon: faCodeBranch,
      canEdit: false,
      value1: node?.nodeInfoSnapshot?.version?.major,
      value2: node?.nodeInfoSnapshot?.version?.versionType,
      value1Name: 'Major version',
      value2Name: 'Type'
    },
    {
      id: 5,
      name: 'Connection details',
      icon: faCodeBranch,
      canEdit: true,
      value1: node?.node?.listeners?.[0].host,
      value2: node?.node?.listeners?.[0].port,
      value1Name: 'IP',
      value2Name: 'Port'
    }
  ];

  const connectionDetails = stats.find(
    (stat) => stat.name === 'Connection details'
  );
  const connectionDetailsObj = {
    IP: connectionDetails.value1,
    Port: connectionDetails.value2
  };

  const tabs = [{ name: 'Configuration', href: '#', current: false }];

  return (
    <div>
      <div className="relative border-b border-gray-200 pb-5 sm:pb-0">
        <div className="md:flex md:items-center md:justify-between">
          <h3 className="text-base font-semibold leading-6 text-white">
            {uniqueId}
          </h3>
          <div className="mt-3 flex md:absolute md:right-0 md:top-3 md:mt-0">
            {error && <span className="text-red-500 pt-1.5">{error}</span>}
            <button
              type="button"
              className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
        <div className="mt-4">
          <div className="sm:hidden">
            <label htmlFor="current-tab" className="sr-only">
              Select a tab
            </label>
            <select
              id="current-tab"
              name="current-tab"
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            ></select>
          </div>
          <div className="hidden sm:block">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <a
                  key={tab.name}
                  href={tab.href}
                  className={
                    'text-white hover:border-indigo-500 whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium'
                  }
                  aria-current={tab.current ? 'page' : undefined}
                >
                  <span className="">{tab.name}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <ul
        role="list"
        className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8 pt-4"
      >
        {stats.map((stats) => (
          <li
            key={stats.id}
            className="overflow-hidden rounded-xl border border-gray-200"
          >
            <div className="flex items-center gap-x-4 border-b bg-transparent p-6 divider text-light-color">
              <FontAwesomeIcon
                icon={stats.icon}
                className="h-4 w-4 p-2 flex-none rounded-lg bg-transparent object-cover ring-1 ring-white"
              />
              <div className="text-sm font-medium leading-6 text-light-color">
                {stats.name}
              </div>
              <div className="ml-auto">
                {stats.canEdit ? 'Can edit' : 'View only'}
              </div>
            </div>
            <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-light-color">{stats.value1Name}</dt>
                <dd className="text-light-color flex items-center">
                  <div className="">
                    <input
                      type="text"
                      className="text-sm rounded bg-transparent w-36"
                      defaultValue={stats.value1}
                      disabled={stats.canEdit === false}
                      hidden={!stats.value1}
                      onChange={(e) =>
                        setEditedFields({
                          ...editedFields,
                          [stats.value1Name]: e.target.value
                        })
                      }
                    />
                  </div>
                </dd>
              </div>

              {stats.value2 && (
                <div className="flex justify-between gap-x-4 py-3">
                  <dt className="text-light-color">{stats.value2Name}</dt>
                  <dd className="flex items-start gap-x-2">
                    <div className="text-light-color">
                      <input
                        type="text"
                        className="text-sm rounded bg-transparent w-36"
                        defaultValue={stats.value2}
                        disabled={stats.canEdit === false}
                        onChange={(e) =>
                          setEditedFields({
                            ...editedFields,
                            [stats.value2Name]: e.target.value
                          })
                        }
                      />
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
