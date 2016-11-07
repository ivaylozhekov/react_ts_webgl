import {api} from '../../utilities/services/rest';

export const fetchActor = () => {
  return api.get('/userID').then(res => {
    return res.data;
  });
};

export const fetchActorProjects = () => {
  return api.get('/project').then(res => {
    return res.data;
  }).catch(err => {
    return [];
  });
};

export const fetchActorUnits = () => {
  const mockData = {
    'members': [
      {
        'id': 0,
        'fullName': 'David M. McCollum',
        'imgSrc': 'http://static.cdn.epam.com/avatar/18f88641f99a0c48170f3439527b967e.jpg',
        'projects': [0, 1, 2, 3],
      },
      {
        'id': 1,
        'fullName': 'Emma Chesnakova',
        'imgSrc': 'http://static.cdn.epam.com/avatar/18f88641f99a0c48170f3439527b967e.jpg',
        'projects': [0, 1, 2, 3],
      },
      {
        'id': 2,
        'fullName': 'Gregory C. Arndt',
        'imgSrc': 'http://static.cdn.epam.com/avatar/18f88641f99a0c48170f3439527b967e.jpg',
        'projects': [0, 1, 2, 3],
      },
      {
        'id': 3,
        'fullName': 'Sergey McKinnley',
        'imgSrc': 'http://static.cdn.epam.com/avatar/18f88641f99a0c48170f3439527b967e.jpg',
        'projects': [0, 1, 2, 3],
      },
      {
        'id': 4,
        'fullName': 'Vitali Novikau',
        'imgSrc': 'http://static.cdn.epam.com/avatar/18f88641f99a0c48170f3439527b967e.jpg',
        'projects': [0, 1, 2],
      },
      {
        'id': 5,
        'fullName': 'Vheronica Alekseyeva',
        'imgSrc': 'http://static.cdn.epam.com/avatar/18f88641f99a0c48170f3439527b967e.jpg',
        'projects': [0, 1],
      },
      {
        'id': 6,
        'fullName': 'Wisia Chmielewska',
        'imgSrc': 'http://static.cdn.epam.com/avatar/18f88641f99a0c48170f3439527b967e.jpg',
        'projects': [0],
      },
      {
        'id': 7,
        'fullName': 'David M. Smith',
        'imgSrc': 'http://static.cdn.epam.com/avatar/18f88641f99a0c48170f3439527b967e.jpg',
        'projects': [0, 1, 2, 3],
      },
    ],
    projects: {
      0: 'EPM-CAN',
      1: 'EPM-WEB',
      2: 'TAS-PAC',
      3: 'EPM-MPE',
    },
  };

  return new Promise((resolve, reject) => {
    resolve(mockData);
  });

};
